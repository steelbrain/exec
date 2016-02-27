'use strict'

/* @flow */

import invariant from 'assert'
import type {Exec$Options} from './types'

export function validate(filePath: string, parameters: Array<string>, options: Exec$Options) {
  invariant(typeof filePath === 'string', 'filePath must be a string')
  invariant(Array.isArray(parameters), 'parameters must be an array')
  invariant(typeof options === 'object' && options, 'options must be an object')
  if (options.stream) {
    const stream = options.stream
    invariant(stream === 'both' || stream === 'stdout' || stream === 'stderr', 'options.stream should be stdout|stderr|both')
  } else options.stream = 'stdout'
  if (options.timeout) {
    invariant(typeof options.timeout === 'number', 'options.timeout must be a number')
  } else options.timeout = Infinity
}
