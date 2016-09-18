/* @flow */

import { spawn } from 'child_process'
import { getENOENTError, getSpawnOptions, validate, escape, shouldNormalizeForWindows } from './helpers'
import type { OptionsAccepted, Result } from './types'

async function exec(
  givenFilePath: string,
  givenParameters: Array<string> = [],
  givenOptions: OptionsAccepted = {}
): Promise<Result> {
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

  return await new Promise(function(resolve, reject) {
    const spawnedProcess = spawn(filePath, parameters, nodeSpawnOptions)
    const data = { stdout: [], stderr: [] }
    let timeout

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
    spawnedProcess.on('error', function(error) {
      reject(error)
    })
    spawnedProcess.on('close', function(exitCode) {
      clearTimeout(timeout)

      const stdout = data.stdout.join('').trim()
      const stderr = data.stderr.join('').trim()

      // NOTE: On windows, we spawn everything through cmd.exe
      // So we have to manually construct ENOENT from it's error message
      if (
        spawnedCmdOnWindows &&
        stderr === `'${givenFilePath}' is not recognized as an internal or external command,\r\noperable program or batch file.`
      ) {
        reject(getENOENTError(givenFilePath, givenParameters))
        return
      }

      if (options.stream === 'stdout') {
        if (stderr && options.throwOnStdErr) {
          reject(new Error(stderr))
        } else {
          if (exitCode !== 0 && !options.ignoreExitCode) {
            console.error('[exec] Process exited with no-zero code, stdout: ', stdout)
            reject(new Error(`Process exited with non-zero code: ${exitCode}`))
          } else {
            resolve(stdout)
          }
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

    if (spawnedProcess.stdin) {
      if (options.stdin) {
        try {
          spawnedProcess.stdin.write(options.stdin)
        } catch (_) { /* No Op */ }
      }
      try {
        spawnedProcess.stdin.end()
      } catch (_) { /* No Op */ }
    }

    if (options.timeout !== Infinity) {
      timeout = setTimeout(function() {
        try {
          spawnedProcess.kill()
        } catch (_) { /* No Op */ }
        reject(new Error('Process execution timed out'))
      }, options.timeout)
    }
  })
}

function execNode(filePath: string, parameters: Array<string> = [], options: OptionsAccepted = {}): Promise<Result> {
  validate(filePath, parameters, options)
  return exec(process.execPath, [filePath].concat(parameters), options)
}

module.exports = { exec, execNode }
