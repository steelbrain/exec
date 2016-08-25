'use strict'

process.stdout.write('STDOUT')

if (process.argv.indexOf('error') !== -1) {
  process.stderr.write('STDERR')
} else if (process.argv.indexOf('input') !== -1) {
  process.stdin.on('data', function(chunk) {
    process.stdout.write(chunk)
  })
}
