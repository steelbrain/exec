import fs from 'fs'
import path from 'path'
import test from 'ava'

import { exec, execFile } from '..'

const fixtureBasic = path.join(__dirname, 'fixtures', 'basic.js')

test('works with ls', async t => {
  const output = await exec('ls', [], {
    cwd: __dirname,
  })

  t.is(output.exitCode, 0)
  t.is(output.stderr, '')
  t.is(output.stdout, 'fixtures\nindex-test.ts\nsnapshots\n')

  t.snapshot(output)
})

test('returns a buffer when appropriate', async t => {
  const output = await exec('ls', [], {
    cwd: __dirname,
    encoding: 'buffer',
  })

  t.is(output.exitCode, 0)
  t.deepEqual(output.stderr, Buffer.from('', 'utf8'))
  t.deepEqual(output.stdout, Buffer.from('fixtures\nindex-test.ts\nsnapshots\n', 'utf8'))

  t.snapshot(output)
})

test('works with ls and args', async t => {
  const output = await exec('ls', ['-a'], {
    cwd: path.dirname(__dirname),
  })
  const listItems = await new Promise<string[]>((resolve, reject) => {
    fs.readdir(path.dirname(__dirname), function(err, res) {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })

  // Add empty line
  listItems.push('')
  // Push dot and dot dot to match ls
  listItems.unshift('.', '..')

  t.is(output.exitCode, 0)
  t.is(output.stderr, '')
  t.is(output.stdout, listItems.join('\n'))

  t.snapshot(output)
})

test('has a working stderr', async t => {
  const output = await exec('ls', ['/non-existent-dir'])
  t.truthy(output.exitCode === 1 || output.exitCode === 2, 'output.exitCode is non-zero')
  t.truthy(
    output.stderr === 'ls: /non-existent-dir: No such file or directory\n' ||
      output.stderr === `ls: cannot access '/non-existent-dir': No such file or directory\n`,
    'has correct stderr error message',
  )
  t.is(output.stdout, '')
})

test('has a working execFile', async t => {
  const output = await execFile(fixtureBasic, [])

  t.is(output.exitCode, 0)
  t.is(output.stderr, 'STDERR-9\n')
  t.is(output.stdout, `STDOUT-6\n${path.dirname(__dirname)}\n`)
})

test('has a working execFile with cwd', async t => {
  const output = await execFile(fixtureBasic, [], {
    cwd: path.join(__dirname, 'fixtures'),
  })

  t.is(output.exitCode, 0)
  t.is(output.stderr, 'STDERR-9\n')
  t.is(output.stdout, `STDOUT-6\n${path.join(__dirname, 'fixtures')}\n`)
})
