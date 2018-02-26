/* @flow */

export type OptionsAccepted = {
  stream?: 'stdout' | 'stderr' | 'both',
  streaming?: boolean,
  timeout?: number,
  env?: Object,
  stdin?: string | Buffer,
  local?: {
    directory: string,
    prepend?: boolean,
  },
  throwOnStderr?: boolean,
  allowEmptyStderr?: boolean,
  ignoreExitCode?: boolean,
}

export type Options = {
  stream: 'stdout' | 'stderr' | 'both',
  streaming: boolean,
  timeout: number,
  env: Object,
  stdin: ?string,
  local?: {
    directory: string,
    prepend: boolean,
  },
  throwOnStderr: boolean,
  allowEmptyStderr: boolean,
  ignoreExitCode: boolean,
}

export type Result = string | { stdout: string, stderr: string, exitCode: number }
