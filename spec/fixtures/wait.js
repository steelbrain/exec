'use strict'

const waitTime = parseInt(process.argv[2], 10) || 0

setTimeout(function() {
  process.stdout.write('PASSED')
}, waitTime)
