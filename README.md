# Exec

[![Greenkeeper badge](https://badges.greenkeeper.io/steelbrain/exec.svg)](https://greenkeeper.io/)

Node's Process spawning APIs beautified.

## Installation

```sh
npm install --save sb-exec
```

## API

```js
type $OptionsAccepted = {
  timeout?: number | Infinity, // In milliseconds
  stream?: 'stdout' | 'stderr'  | 'both',
  streaming?: boolean = false,
  env: Object,
  stdin?: string | Buffer,
  local?: {
    directory: string,
    prepend?: boolean
  },
  throwOnStderr?: boolean = true,
  allowEmptyStderr?: boolean = false,
  ignoreExitCode?: boolean
} // Also supports all options of child_process::spawn

type Result =
  | string
  // ^ If stream was set to stdout OR stderr
  | { stdout: string, stderr: string, exitCode: ?number }
  // ^ If stream was set to 'both'

type PromisedProcess = {
  childProcess: ChildProcess,
  kill(signal): void,
  // ^ Just like process.kill(...) except it kills spawned sub-processes on windows
  output:
    | Result
    // If streaming was set to false (default value)
    | Promise<Result>
    // ^ If streaming was set to true
}

export function exec(filePath: string, parameters?: array, options?: $OptionsAccepted): Promise<PromisedProcess>
export function execNode(filePath: string, parameters?: array, options?: $OptionsAccepted): Promise<PromisedProcess>
```

## Usage with streaming

Assuming `some-file.js` has the contents of `console.log('Hi')`

```js
import { execNode } from 'sb-exec'

execNode('./some-file.js', ['hello', 'world'], { streaming: true, stream: 'both' }).then(result => {
  result.spawnedProcess.on('stdout', function(chunk) {
    // ...
  })
  result.output.then(function(output) {
    console.log(output.stdout) // Output: Hi
    console.log(output.stderr) // Output:
    console.log(output.exitCode) // Output: 0
  })
})
```

## Usage without streaming

Everything's the same except `result.output` is not a promise this time, but is already awaited so

```js
import { execNode } from 'sb-exec'

execNode('./some-file.js', ['hello', 'world'], { streaming: true, stream: 'both' }).then(result => {
  result.spawnedProcess.on('stdout', function(chunk) {
    // ...
  })
  console.log(result.output.stdout) // Output: Hi
  console.log(result.output.stderr) // Output:
  console.log(result.output.exitCode) // Output: 0
})
```

## Explanation

### `options.local`

`options.local` adds node executables in `node_modules` relative to
`options.local.directory` to `PATH` like in npm scripts.

`options.local.prepend` prioritizes local executables over ones already in `PATH`.

## License

This project is licensed under the terms of MIT License, see the LICENSE file
for more info
