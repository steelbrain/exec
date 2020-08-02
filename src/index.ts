import { ExecOptions, ChildProcess, spawn } from 'child_process'

interface ExtendedExecOptions extends ExecOptions {
  handleChildProcess(childProcess: ChildProcess): void
}

interface ProcessPromise<T = any> extends Promise<T> {
  kill(signal?: NodeJS.Signals | number): boolean
}

async function execInternal(
  command: string,
  args: string[],
  options: (
    | ({ encoding?: 'buffer' | null } & Omit<ExtendedExecOptions, 'stdio'>)
    | ({ encoding?: 'buffer' | null } & ExtendedExecOptions)
    | ({ encoding: BufferEncoding } & Omit<ExtendedExecOptions, 'stdio'>)
    | ({ encoding: BufferEncoding } & ExtendedExecOptions)) &
    ({
      handleChildProcess(childProcess: ChildProcess): void
    }),
): Promise<{
  stdout: string | Buffer | null
  stderr: string | Buffer | null
  exitCode: number
}> {
  const spawnedProcess = spawn(command, args, options)
  const promise = new Promise<{
    stdout: string | Buffer | null
    stderr: string | Buffer | null
    exitCode: number
  }>((resolve, reject) => {
    const output = {
      stdout: spawnedProcess.stdout ? ([] as (string | Buffer)[]) : null,
      stderr: spawnedProcess.stderr ? ([] as (string | Buffer)[]) : null,
    }

    spawnedProcess.on('error', reject)
    if (spawnedProcess.stdout) {
      spawnedProcess.stdout.on('data', function(chunk) {
        output.stdout!.push(chunk)
      })
    }
    if (spawnedProcess.stderr) {
      spawnedProcess.stderr.on('data', function(chunk) {
        output.stderr!.push(chunk)
      })
    }

    spawnedProcess.on('close', code => {

      let outputStdout: string | Buffer | null = null
      if (output.stdout != null) {
        outputStdout =
          options.encoding === null || options.encoding === 'buffer'
            ? Buffer.concat(output.stdout as Buffer[])
            : output.stdout.join('')
      }
      let outputStderr: string | Buffer | null = null
      if (output.stderr != null) {
        outputStderr =
          options.encoding === null || options.encoding === 'buffer'
            ? Buffer.concat(output.stderr as Buffer[])
            : output.stderr.join('')
      }

      resolve({
        exitCode: code ?? null,
        stdout: outputStdout,
        stderr: outputStderr,
      })
    })
  })

  options.handleChildProcess(spawnedProcess)

  return promise
}

export function exec(
  command: string,
  args: string[],
  options?: { encoding?: 'buffer' | null } & Omit<ExtendedExecOptions, 'stdio'>,
): ProcessPromise<{
  stdout: Buffer
  stderr: Buffer
  exitCode: number
}>
export function exec(
  command: string,
  args: string[],
  options?: { encoding?: 'buffer' | null } & ExtendedExecOptions,
): ProcessPromise<{
  stdout: Buffer | null
  stderr: Buffer | null
  exitCode: number
}>
export function exec(
  command: string,
  args: string[],
  options?: { encoding: BufferEncoding } & Omit<ExtendedExecOptions, 'stdio'>,
): ProcessPromise<{
  stdout: string
  stderr: string
  exitCode: number
}>
export function exec(
  command: string,
  args: string[],
  options?: { encoding: BufferEncoding } & ExtendedExecOptions,
): ProcessPromise<{
  stdout: string | null
  stderr: string | null
  exitCode: number
}>

export function exec(
  command: string,
  args: string[],
  options?:
    | ({ encoding?: 'buffer' | null } & Omit<ExtendedExecOptions, 'stdio'>)
    | ({ encoding?: 'buffer' | null } & ExtendedExecOptions)
    | ({ encoding: BufferEncoding } & Omit<ExtendedExecOptions, 'stdio'>)
    | ({ encoding: BufferEncoding } & ExtendedExecOptions),
): ProcessPromise<{
  stdout: string | Buffer | null
  stderr: string | Buffer | null
  exitCode: number
}> {
  let spawnedProcess: ChildProcess

  const promise = execInternal(command, args, {
    ...options,
    handleChildProcess(_spawnedProcess) {
      spawnedProcess = _spawnedProcess
    }
  }) as ProcessPromise<{
    stdout: string | Buffer | null
    stderr: string | Buffer | null
    exitCode: number
  }>

  promise.kill = function(signal?: NodeJS.Signals | number) {
    return spawnedProcess.kill(signal)
  }

  return promise
}
