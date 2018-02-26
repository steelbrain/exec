/* @flow */

import Path from 'path'
import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import { getENOENTError, getSpawnOptions, validate, escape, shouldNormalizeForWindows } from './helpers'
import type { OptionsAccepted, Options, Result } from './types'

async function handleProcessStdin(spawnedProcess: ChildProcess, options: Options) {
  if (spawnedProcess.stdin) {
    if (options.stdin) {
      try {
        spawnedProcess.stdin.write(options.stdin)
      } catch (_) {
        /* No Op */
      }
    }
    try {
      spawnedProcess.stdin.end()
    } catch (_) {
      /* No Op */
    }
  }
}
function handleProcessTimeout(spawnedProcess: ChildProcess, options: Options): Promise<void> {
  if (options.timeout === Infinity) return Promise.resolve()
  return new Promise(function(resolve, reject) {
    const timeout = setTimeout(function() {
      // eslint-disable-next-line no-use-before-define
      killProcess(spawnedProcess)
      reject(new Error('Process execution timed out'))
    }, options.timeout)
    spawnedProcess.on('close', function() {
      clearTimeout(timeout)
      resolve()
    })
  })
}
function handleProcessResult(
  spawnedProcess: ChildProcess,
  options: Options,
  filePath: string,
  parameters: Array<string>,
  spawnedCmdOnWindows: boolean,
): Promise<Result> {
  return new Promise(function(resolve, reject) {
    const data = { stdout: [], stderr: [] }
    if (spawnedProcess.stdout) {
      spawnedProcess.stdout.on('data', function(chunk) {
        data.stdout.push(chunk)
      })
    }
    if (spawnedProcess.stderr) {
      spawnedProcess.stderr.on('data', function(chunk) {
        data.stderr.push(chunk)
      })
    }
    spawnedProcess.on('error', reject)
    spawnedProcess.on('close', function(exitCode) {
      const stdout = data.stdout.join('').trim()
      const stderr = data.stderr.join('').trim()

      // NOTE: On windows, we spawn everything through cmd.exe
      // So we have to manually construct ENOENT from it's error message
      if (
        spawnedCmdOnWindows &&
        stderr === `'${filePath}' is not recognized as an internal or external command,\r\noperable program or batch file.`
      ) {
        reject(getENOENTError(filePath, parameters))
        return
      }

      if (exitCode === null) {
        reject(new Error('Process was killed'))
        return
      }

      if (options.stream === 'stdout') {
        if (stderr && options.throwOnStderr) {
          reject(new Error(stderr))
        } else if (exitCode !== 0 && !options.ignoreExitCode) {
          console.error('[exec] Process exited with no-zero code, stdout: ', stdout)
          reject(new Error(`Process exited with non-zero code: ${exitCode}`))
        } else {
          resolve(stdout)
        }
      } else if (options.stream === 'stderr') {
        if (stderr.length === 0 && !options.allowEmptyStderr) {
          reject(new Error(`Process exited with no output, code: ${exitCode}`))
        } else {
          resolve(stderr)
        }
      } else {
        resolve({ stdout, stderr, exitCode })
      }
    })
  })
}

async function exec(
  givenFilePath: string,
  givenParameters: Array<string>,
  givenOptions: Object,
): Promise<{
  spawnedProcess: ChildProcess,
  output: Promise<Result>,
}> {
  const options = validate(givenFilePath, givenParameters, givenOptions)

  const nodeSpawnOptions = await getSpawnOptions(options)
  let filePath = givenFilePath
  let parameters = givenParameters
  let spawnedCmdOnWindows = false

  if (shouldNormalizeForWindows(filePath, options)) {
    nodeSpawnOptions.windowsVerbatimArguments = true
    let cmdArgs = [filePath]
    // filePath must be escaped if it has a \s in it, otherwise it must not
    if (/\s/.test(filePath)) {
      cmdArgs = cmdArgs.map(escape)
    }
    cmdArgs = cmdArgs.concat(parameters.map(escape))
    filePath = process.env.comspec || 'cmd.exe'
    parameters = ['/s', '/c', `"${cmdArgs.join(' ')}"`]
    spawnedCmdOnWindows = true
  }

  const spawnedProcess = spawn(filePath, parameters, nodeSpawnOptions)
  handleProcessStdin(spawnedProcess, options)

  return {
    spawnedProcess,
    // eslint-disable-next-line no-use-before-define
    kill: signal => killProcess(spawnedProcess, signal),
    output: Promise.all([
      handleProcessResult(spawnedProcess, options, givenFilePath, givenParameters, spawnedCmdOnWindows),
      handleProcessTimeout(spawnedProcess, options),
    ]).then(results => results[0]),
  }
}

// NOTE: This proxy function is required to allow .kill() in different stages of process spawn
// We cannot put this logic into exec() directly because it's an async function and doesn't
// allow us to temper the underlying promise
function execProxy(filePath: string, parameters: Array<string> = [], options: OptionsAccepted = {}): any {
  return exec(filePath, parameters, options)
}

async function killProcess(spawnedProcess: Object, signal: string = 'SIGTERM'): Promise<void> {
  const spawnfile = Path.basename(spawnedProcess.spawnfile)
  if (process.platform !== 'win32' || spawnfile === 'wmic.exe' || spawnfile === 'wmic') {
    // Also do this if the process is wmic
    spawnedProcess.kill(signal)
    return
  }
  try {
    const output: any = await await execProxy(
      'wmic',
      ['process', 'where', `(ParentProcessId=${spawnedProcess.pid})`, 'get', 'processid'],
      { stream: 'stdout', timeout: 60 * 1000 },
    ).output
    output
      .split(/\s+/)
      .filter(i => /^\d+$/.test(i))
      .map(i => parseInt(i, 10))
      .filter(i => i !== spawnedProcess.pid && i > 0)
      .forEach(function(pid) {
        process.kill(pid, signal)
      })
  } catch (error) {
    /* No Op */
  }
}

function execNode(filePath: string, parameters: Array<string> = [], givenOptions: OptionsAccepted = {}): any {
  validate(filePath, parameters, givenOptions)
  return execProxy(process.execPath, [filePath].concat(parameters), givenOptions)
}

module.exports = { exec: execProxy, execNode }
