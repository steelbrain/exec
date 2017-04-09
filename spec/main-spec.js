/* @flow */

import Path from 'path'
import invariant from 'assert'
import { it } from 'jasmine-fix'
import { exec, execNode } from '../src'

const PATH_NODE = Path.join(__dirname, 'fixtures', 'node.js')
const PATH_WAIT = Path.join(__dirname, 'fixtures', 'wait.js')
const PATH_ENV = Path.join(__dirname, 'fixtures', 'env.js')

describe('exec', function() {
  it('works with stdout', async function() {
    const result = await exec(process.execPath, [PATH_NODE])
    expect(result).toBe('STDOUT')
  })

  it('throws if we are expecting on stderr and get output on stdout', async function() {
    try {
      await exec(process.execPath, [PATH_NODE, 'error'])
      expect(false).toBe(true)
    } catch (_) {
      expect(_.message).toBe('STDERR')
    }
  })

  it("doesn't mind when we are expecting on stderr though", async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'error'], { stream: 'stderr' })
    expect(result).toBe('STDERR')
  })

  it('also supports giving out both streams at once', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'error'], { stream: 'both' })
    invariant(typeof result === 'object' && result)
    expect(result.stderr).toBe('STDERR')
    expect(result.stdout).toBe('STDOUT')
  })

  it('passes on stdin properly', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'input'], { stdin: 'hello dolly' })
    expect(result).toBe('STDOUThello dolly')
  })

  it('passes on stdin Buffers properly', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'input'], { stdin: Buffer.from('Wakey Wakey') })
    expect(result).toBe('STDOUTWakey Wakey')
  })

  it('ignores stderr if throwOnStderr is specified', async function() {
    const result = await exec(process.execPath, [PATH_NODE, 'error'], { throwOnStderr: false })
    expect(result).toBe('STDOUT')
  })

  it('acts like a good boy if script terminates before timeout', async function() {
    const result = await exec(process.execPath, [PATH_WAIT, '1000'], { timeout: 1500 })
    expect(result).toBe('PASSED')
  })

  it('terminates the script and errors if the process times out', async function() {
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
      SOMETHING_ELSE: 'Dolly',
    } })
    expect(result).toBe('Hello\nDolly')
  })

  it('works well with stdio: inherit', async function() {
    const result = await exec(process.execPath, [PATH_ENV], { env: {
      SOMETHING: 'Hello',
      SOMETHING_ELSE: 'Dolly',
    },
      stdio: 'inherit' })
    expect(result).toBe('')
  })

  describe('supports executing modules', function() {
    it('from local paths', async function() {
      const result = await exec('sb-exec-test', [], { local: {
        directory: Path.join(__dirname, 'fixtures', 'path'),
      } })
      expect(result).toBe('HEY')
    })

    it('supports prepend', async function() {
      const PATH = Path.join(__dirname, 'fixtures', 'path', 'node_modules', '.bin')
      const result = await exec('sb-exec-test', [], { local: {
        directory: Path.join(__dirname, 'fixtures', 'deep'),
        prepend: true,
      },
        env: { PATH } })
      expect(result).toBe('HEY2')
    })

    it('supports append', async function() {
      const PATH = Path.join(__dirname, 'fixtures', 'path', 'node_modules', '.bin')
      const result = await exec('sb-exec-test', [], { local: {
        directory: Path.join(__dirname, 'fixtures', 'deep'),
      },
        env: { PATH } })
      expect(result).toBe('HEY')
    })
  })
})

describe('execNode', function() {
  it('is a sugar method that uses exec', async function() {
    const result = await execNode(PATH_NODE)
    expect(result).toBe('STDOUT')
  })

  it('cries if stream is stdout and exit code is non-zero', async function() {
    const path = Path.join(__dirname, 'fixtures', 'non-zero.js')
    try {
      await execNode(path)
      expect(false).toBe(true)
    } catch (_) {
      expect(_.message).toContain('code: 2')
    }
  })

  it('does not cry if stream is stdout, exit code is non-zero and ignoreExitCode is set to true', async function() {
    const path = Path.join(__dirname, 'fixtures', 'non-zero.js')
    await execNode(path, [], { ignoreExitCode: true })
  })

  it('returns exitCode for `both` streams', async function() {
    const path = Path.join(__dirname, 'fixtures', 'non-zero.js')
    const output = await execNode(path, [], { stream: 'both' })
    invariant(typeof output === 'object' && output)
    expect(output.exitCode).toBe(2)
  })

  it('throws if stream is `stderr` and the output is empty', async function() {
    const path = Path.join(__dirname, 'fixtures', 'non-zero.js')
    try {
      await execNode(path, [], { stream: 'stderr' })
      expect(false).toBe(true)
    } catch (_) {
      expect(_.message).toContain('code: 2')
      expect(_.message).toContain('with no output')
    }
  })

  it('does not throw on `stderr` if the output is empty and allowEmptyStderr is set to false', async function() {
    const path = Path.join(__dirname, 'fixtures', 'non-zero.js')
    const output = await execNode(path, [], { stream: 'stderr', allowEmptyStderr: true })
    expect(output).toBe('')
  })

  it('automatically converts non-stringish parameters to string', async function() {
    const path = Path.join(__dirname, 'fixtures', 'env-coerce.js')
    // $FlowIgnore: We're passing wrong param type on purpose
    const output = await execNode(path, [2, 3, 2.2, false])
    expect(output).toBe('2 3 2.2 false')
  })

  it('has a working kill method', async function() {
    const path = Path.join(__dirname, 'fixtures', 'on-kill.js')
    const promise = execNode(path, [], {})
    // $FlowIgnore: Custom function
    promise.kill()
    try {
      await promise
      expect(false).toBe(true)
    } catch (error) {
      expect(error.message.startsWith('Process exited with non-zero code')).toBe(true)
    }
  })
})

if (process.platform === 'win32') {
  describe('works on Windows', function() {
    it('works with paths that have spaces in name', async function() {
      const result = await exec(Path.join(__dirname, './fixtures/yes spaces/hello.exe'))
      expect(result).toBe('Hello World')
    })

    it('works with paths without pathext', async function() {
      const result = await exec(Path.join(__dirname, './fixtures/yes spaces/hello'))
      expect(result).toBe('Hello World')
    })
    it('throws ENOENT errors proeprly', async function() {
      try {
        await exec('something-non-existent', ['some', 'thing'])
      } catch (error) {
        expect(error.code).toBe('ENOENT')
        expect(error.errno).toBe('ENOENT')
        expect(error.syscall).toBe('spawn something-non-existent')
        expect(error.path).toBe('something-non-existent')
        expect(error.spawnargs).toEqual(['some', 'thing'])
      }
    })
  })
}
