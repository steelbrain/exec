/* @flow */

import invariant from 'assert'
import { async as getEnv } from 'consistent-env'
import { getPathAsync } from 'sb-npm-path'
import type { Exec$Options, Exec$ValidOptions } from './types'

const PATH_SEPARATOR = process.platform === 'win32' ? ';' : ':'

export function validate(filePath: string, parameters: Array<string>, givenOptions: Exec$Options): Exec$ValidOptions {
  const options = givenOptions

  invariant(typeof filePath === 'string' && filePath, 'filePath must be a string')
  invariant(Array.isArray(parameters), 'parameters must be an array')
  invariant(typeof options === 'object' && options, 'options must be an object')
  if (options.stream) {
    const stream = options.stream
    invariant(stream === 'both' || stream === 'stdout' || stream === 'stderr',
      'options.stream should be stdout|stderr|both')
  } else options.stream = 'stdout'
  if (options.timeout) {
    invariant(typeof options.timeout === 'number', 'options.timeout must be a number')
  } else options.timeout = Infinity
  if (options.env) {
    invariant(typeof options.env === 'object', 'options.env must be an object')
  } else options.env = {}
  if (options.stdin) {
    invariant(typeof options.stdin === 'string', 'options.stdin must be an object')
  } else options.stdin = null
  if (typeof options.throwOnStdErr !== 'undefined') {
    invariant(typeof options.throwOnStdErr === 'boolean', 'options.throwOnStdErr must be a boolean')
  } else options.throwOnStdErr = true
  if (typeof options.local !== 'undefined') {
    invariant(typeof options.local === 'object', 'options.local must be an object')
    invariant(typeof options.local.directory === 'string', 'options.local.directory must be a string')
    if (typeof options.local.prepend !== 'undefined') {
      invariant(typeof options.local.prepend === 'boolean', 'options.local.prepend must be a boolean')
    } else options.local.prepend = false
  }
  if (typeof options.allowEmptyStderr !== 'undefined') {
    invariant(typeof options.allowEmptyStderr === 'boolean', 'options.throwWhenEmptyStderr must be a boolean')
  } else options.allowEmptyStderr = false
  if (typeof options.ignoreExitCode !== 'undefined') {
    invariant(typeof options.ignoreExitCode === 'boolean', 'options.ignoreExitCode must be a boolean')
  } else options.ignoreExitCode = false

  return options
}

function caseInsensitiveEnvMerge(envA: Object, envB: Object) {
  // Takes in two environments and creates a merged one with all UPPER CASE keys
  const mergedEnv = {}
  Object.keys(envA).forEach(key => {
    mergedEnv[key.toUpperCase()] = envA[key]
  })
  Object.keys(envB).forEach(key => {
    mergedEnv[key.toUpperCase()] = envB[key]
  })
  return mergedEnv
}

export async function getSpawnOptions(options: Exec$ValidOptions): Promise<Object> {
  const spawnOptions = Object.assign({}, options, {
    env: caseInsensitiveEnvMerge(await getEnv(), options.env),
  })
  let npmPath
  const local = options.local
  if (local) {
    npmPath = await getPathAsync(local.directory)
  }
  if (local && npmPath) {
    for (const key in spawnOptions.env) {
      if ({}.hasOwnProperty.call(spawnOptions.env, key) && key === 'PATH') {
        const value = spawnOptions.env[key]
        spawnOptions.env[key] = local.prepend ? npmPath + PATH_SEPARATOR + value : value + PATH_SEPARATOR + npmPath
        break
      }
    }
  }
  spawnOptions.timeout = null
  if (spawnOptions.env.OS) {
    spawnOptions.env.OS = undefined
  }
  if (process.versions.electron) {
    spawnOptions.env.ELECTRON_RUN_AS_NODE = '1'
    spawnOptions.env.ATOM_SHELL_INTERNAL_RUN_AS_NODE = '1'
    spawnOptions.env.ELECTRON_NO_ATTACH_CONSOLE = '1'
  }
  return spawnOptions
}

export function escape(item: any): string {
  return `"${String(item).replace(/"/g, '\\"')}"`
}
