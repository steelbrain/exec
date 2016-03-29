Exec
====

Node's Process spawning APIs beautified

## Installation

```sh
npm install --save sb-exec
```

## API

```js
type $Options = {
  timeout?: number | Infinity,
  stream?: 'stdout' | 'stderr'  | 'both',
  env: Object,
  stdin?: ?string,
  local?: {
    directory: string,
    prepend?: boolean
  },
  throwOnStderr: boolean
} // Also supports all options of child_process::spawn
export function exec(filePath: string, parameters: array, options: $Options)
export function execNode(filePath: string, parameters: array, options: $Options)
```

## License

This project is licensed under the terms of MIT License, see the LICENSE file for more info
