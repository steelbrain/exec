import { ExecOptions, ChildProcess, spawn } from 'child_process'

interface ExtendedExecOptions<OutputType> extends ExecOptions {
  handleChildProcess?: (childProcess: ChildProcess) => void
  handleStdout?: (chunk: OutputType) => void
  handleStderr?: (chunk: OutputType) => void
}

interface ProcessPromise<T = any> extends Promise<T> {
  kill(signal?: NodeJS.Signals | number): boolean
}

async function execInternal(
  command: string,
  args: string[],
  options: (
    | ({ encoding: 'buffer' | null } & Omit<ExtendedExecOptions<Buffer>, 'stdio'>)
    | ({ encoding: 'buffer' | null } & ExtendedExecOptions<Buffer>)
    | ({ encoding?: BufferEncoding } & Omit<ExtendedExecOptions<string>, 'stdio'>)
    | ({ encoding?: BufferEncoding } & ExtendedExecOptions<string>)) &
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
        if (options.handleStdout) {
          options.handleStdout(chunk)
        }
      })
    }
    if (spawnedProcess.stderr) {
      spawnedProcess.stderr.on('data', function(chunk) {
        output.stderr!.push(chunk)
        if (options.handleStderr) {
          options.handleStderr(chunk)
        }
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
        exitCode: code,
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
  options: { encoding: 'buffer' | null } & Omit<ExtendedExecOptions<Buffer>, 'stdio'>,
): ProcessPromise<{
  stdout: Buffer
  stderr: Buffer
  exitCode: number
}>
export function exec(
  command: string,
  args: string[],
  options: { encoding: 'buffer' | null } & ExtendedExecOptions<Buffer>,
): ProcessPromise<{
  stdout: Buffer | null
  stderr: Buffer | null
  exitCode: number
}>
export function exec(
  command: string,
  args: string[],
  options?: { encoding?: BufferEncoding } & Omit<ExtendedExecOptions<string>, 'stdio'>,
): ProcessPromise<{
  stdout: string
  stderr: string
  exitCode: number
}>
export function exec(
  command: string,
  args: string[],
  options?: { encoding?: BufferEncoding } & ExtendedExecOptions<string>,
): ProcessPromise<{
  stdout: string | null
  stderr: string | null
  exitCode: number
}>

export function exec(
  command: string,
  args: string[],
  options?:
    | ({ encoding: 'buffer' | null } & Omit<ExtendedExecOptions<Buffer>, 'stdio'>)
    | ({ encoding: 'buffer' | null } & ExtendedExecOptions<Buffer>)
    | ({ encoding?: BufferEncoding } & Omit<ExtendedExecOptions<string>, 'stdio'>)
    | ({ encoding?: BufferEncoding } & ExtendedExecOptions<string>),
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
    },
  }) as ProcessPromise<{
    stdout: string | Buffer | null
    stderr: string | Buffer | null
    exitCode: number
  }>

  promise.kill = function(signal?: NodeJS.Signals | number) {
    // TODO: kill all subprocesses on windows with wmic?
    return spawnedProcess.kill(signal)
  }

  return promise
}

export function execFile(
  filePath: string,
  args: string[],
  options: { encoding: 'buffer' | null } & Omit<ExtendedExecOptions<Buffer>, 'stdio'>,
): ProcessPromise<{
  stdout: Buffer
  stderr: Buffer
  exitCode: number
}>
export function execFile(
  filePath: string,
  args: string[],
  options: { encoding: 'buffer' | null } & ExtendedExecOptions<Buffer>,
): ProcessPromise<{
  stdout: Buffer | null
  stderr: Buffer | null
  exitCode: number
}>
export function execFile(
  filePath: string,
  args: string[],
  options?: { encoding?: BufferEncoding } & Omit<ExtendedExecOptions<string>, 'stdio'>,
): ProcessPromise<{
  stdout: string
  stderr: string
  exitCode: number
}>
export function execFile(
  filePath: string,
  args: string[],
  options?: { encoding?: BufferEncoding } & ExtendedExecOptions<string>,
): ProcessPromise<{
  stdout: string | null
  stderr: string | null
  exitCode: number
}>

export function execFile(
  filePath: string,
  args: string[],
  options?:
    | ({ encoding: 'buffer' | null } & Omit<ExtendedExecOptions<Buffer>, 'stdio'>)
    | ({ encoding: 'buffer' | null } & ExtendedExecOptions<Buffer>)
    | ({ encoding?: BufferEncoding } & Omit<ExtendedExecOptions<string>, 'stdio'>)
    | ({ encoding?: BufferEncoding } & ExtendedExecOptions<string>),
): ProcessPromise<{
  stdout: string | Buffer | null
  stderr: string | Buffer | null
  exitCode: number
}> {
  return exec(process.execPath, [filePath].concat(args), options as any)
  // ^ TS is drunk, force override the type
}
