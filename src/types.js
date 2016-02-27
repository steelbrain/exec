'use strict'

/* @flow */

export type Exec$Options = {
  stream?: 'stdout' | 'stderr' | 'both',
  timeout?: number,
  env?: Object
}
