'use strict'

/* @flow */

import invariant from 'assert'
import { async as getEnv } from 'consistent-env'
import getNpmPath from 'sb-npm-path'
import type { Exec$Options } from './types'

const PATH_SEPARATOR = process.platform === 'win32' ? ';' : ':'
export const assign = Object.assign || function(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key]
    }
  }
  return target
}

export function validate(filePath: string, parameters: Array<string>, options: Exec$Options) {
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
  }
  if (typeof options.allowEmptyStderr !== 'undefined') {
    invariant(typeof options.allowEmptyStderr === 'boolean', 'options.throwWhenEmptyStderr must be a boolean')
  } else options.allowEmptyStderr = false
  if (typeof options.ignoreExitCode !== 'undefined') {
    invariant(typeof options.ignoreExitCode === 'boolean', 'options.ignoreExitCode must be a boolean')
  } else options.ignoreExitCode = false
}

export async function getSpawnOptions(options: Exec$Options): Promise {
  const spawnOptions = assign({}, options, {
    env: assign(await getEnv(), options.env)
  })
  const local = options.local
  if (local) {
    const npmPath = await getNpmPath.async(local.directory)
    for (const key in spawnOptions.env) {
      if (spawnOptions.env.hasOwnProperty(key) && key.toUpperCase() === 'PATH') {
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

export function escape(item: string): string {
  return `"${item.replace(/"/g, '\\"')}"`
}
