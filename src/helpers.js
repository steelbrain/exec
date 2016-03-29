'use strict'

/* @flow */

import invariant from 'assert'
import type {Exec$Options} from './types'

export const assign = Object.assign || function (target, source) {
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
    invariant(stream === 'both' || stream === 'stdout' || stream === 'stderr', 'options.stream should be stdout|stderr|both')
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
}
