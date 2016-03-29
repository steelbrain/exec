'use babel'

import Path from 'path'
import { exec, execNode } from '../'
import { it } from './helpers'

const PATH_NODE = Path.join(__dirname, 'fixtures', 'node.js')
const PATH_WAIT = Path.join(__dirname, 'fixtures', 'wait.js')
const PATH_ENV = Path.join(__dirname, 'fixtures', 'env.js')

describe('exec', function() {
  it('works with stdout', async function() {
    const result = await exec(process.execPath, [PATH_NODE])
    expect(result).toBe('STDOUT')
  })

  it('throws if we are expecting on stderr and get on stdout', async function() {
    try {
      await exec(process.execPath, [PATH_NODE, 'error'])
      expect(false).toBe(true)
    } catch (_) {
      expect(_.message).toBe('STDERR')
    }
  })

  it('doesnt mind when we are expecting on stderr though', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'error'], { stream: 'stderr' })
    expect(result).toBe('STDERR')
  })

  it('also supports giving out both streams at once', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'error'], { stream: 'both' })
    expect(result.stderr).toBe('STDERR')
    expect(result.stdout).toBe('STDOUT')
  })

  it('passes on stdin properly', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'input'], { stdin: 'hello dolly' })
    expect(result).toBe('STDOUThello dolly')
  })

  it('ignores stderr if throwOnStdErr is specified', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'error'], { throwOnStdErr: false })
    expect(result).toBe('STDOUT')
  })

  it('acts like a good buy if script terminates before timeout', async function() {
    const result = await exec(process.execPath, [PATH_WAIT, '1000'], { timeout: 1500 })
    expect(result).toBe('PASSED')
  })

  it('termintes the script and errors if the process times out', async function() {
    try {
      await exec(process.execPath, [PATH_WAIT, '2000'], { timeout: 1000 })
      expect(false).toBe(true)
    } catch (_) {
      expect(_.message).toContain('timed out')
    }
  })

  it('ignores timeouts completely if no timeout is specified', async function() {
    const result = await exec(process.execPath, [PATH_WAIT, '7000'])
    expect(result).toBe('PASSED')
  })

  it('passes env properly', async function() {
    const result = await exec(process.execPath, [PATH_ENV], { env: {
      SOMETHING: 'Hello',
      SOMETHING_ELSE: 'Dolly'
    } })
    expect(result).toBe('Hello\nDolly')
  })

  it('works well with stdio: inherit', async function() {
    const result = await exec(process.execPath, [PATH_ENV], { env: {
      SOMETHING: 'Hello',
      SOMETHING_ELSE: 'Dolly'
    }, stdio: 'inherit' })
    expect(result).toBe('')
  })
})

describe('execNode', function() {
  it('is a sugar method that uses exec', async function() {
    const result = await execNode(PATH_NODE)
    expect(result).toBe('STDOUT')
  })
})
