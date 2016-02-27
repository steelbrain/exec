'use strict'

/* @flow */

import {validate} from './helpers'
import type {Exec$Options} from './types'

function exec(filePath: string, parameters: Array<string>, options: Exec$Options) {
  validate(filePath, parameters, options)
}

function execNode(filePath: string, parameters: Array<string>, options: Exec$Options) {
  validate(filePath, parameters, options)
}

module.exports = { exec, execNode }
