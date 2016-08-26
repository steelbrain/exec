# Exec

Node's Process spawning APIs beautified

## Installation

```sh
npm install --save sb-exec
```

## API

```js
type $OptionsAccepted = {
  timeout?: number | Infinity,
  stream?: 'stdout' | 'stderr'  | 'both',
  env: Object,
  stdin?: ?string,
  local?: {
    directory: string,
    prepend?: boolean
  },
  throwOnStdErr?: boolean = true,
  allowEmptyStderr?: boolean = false,
  ignoreExitCode?: boolean
} // Also supports all options of child_process::spawn
export function exec(filePath: string, parameters: array, options: $OptionsAccepted)
export function execNode(filePath: string, parameters: array, options: $OptionsAccepted)
```

## Explanation

### `options.local`

`options.local` adds node executables in `node_modules` relative to
`options.local.directory` to `PATH` like in npm scripts.

`options.local.prepend` prioritizes local executables over ones already in `PATH`.

## License

This project is licensed under the terms of MIT License, see the LICENSE file
for more info
