'use babel'

import Path from 'path'
import {exec, execNode} from '../'
import {it} from './helpers'

const PATH_NODE = Path.join(__dirname, 'fixtures', 'node.js')

describe('exec', function() {
  it('works with stdout', async function() {
    const result = await exec(process.execPath, [PATH_NODE])
    expect(result).toBe('STDOUT')
  })

  it('throws if we are expecting on stderr and get on stdout', async function() {
    try {
      const result = await exec(process.execPath, [PATH_NODE, 'error'])
      expect(false).toBe(true)
    } catch (_) {
      expect(_.message).toBe('STDERR')
    }
  })

  it('doesnt mind when we are expecting on stderr though', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'error'], {stream: 'stderr'})
    expect(result).toBe('STDERR')
  })

  it('also supports giving out both streams at once', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'error'], {stream: 'both'})
    expect(result.stderr).toBe('STDERR')
    expect(result.stdout).toBe('STDOUT')
  })

  it('passes on stdin properly', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'input'], {stdin: 'hello dolly'})
    expect(result).toBe('STDOUThello dolly')
  })

  it('ignores stderr if throwOnStdErr is specified', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'error'], {throwOnStdErr: false})
    expect(result).toBe('STDOUT')
  })
})
