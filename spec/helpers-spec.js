/* @flow */

import * as Helpers from '../src/helpers'

describe('Helpers', function() {
  describe('mergeEnv', function() {
    it('returns env as is if not windows', function() {
      const oldPlatform = process.platform
      let platform = 'darwin'
      // $FlowIgnore: Flow is dumb?
      Object.defineProperty(process, 'platform', {
        get() {
          return platform
        },
      })
      expect(Helpers.mergeEnv({ PATH: 'a;b' }, { PATH: 'c' })).toEqual({ PATH: 'c' })
      expect(Helpers.mergeEnv({ PATH: 'a;b' }, { Path: 'c' })).toEqual({ PATH: 'a;b', Path: 'c' })
      expect(Helpers.mergeEnv({ PATH: 'a;b', Path: 'c', a: 'b' }, { PATH: 'd', b: 'c' })).toEqual({ PATH: 'd', Path: 'c', a: 'b', b: 'c' })
      platform = oldPlatform
    })
    it('merges env on windows', function() {
      const oldPlatform = process.platform
      let platform = 'win32'
      // $FlowIgnore: Flow is dumb?
      Object.defineProperty(process, 'platform', {
        get() {
          return platform
        },
      })
      expect(Helpers.mergeEnv({ PATH: 'a;b' }, { PATH: 'c' })).toEqual({ PATH: 'a;b;c' })
      expect(Helpers.mergeEnv({ PATH: 'a;b' }, { Path: 'c' })).toEqual({ PATH: 'a;b;c' })
      expect(Helpers.mergeEnv({ PATH: 'a;b', Path: 'c', e: 'f' }, { PATH: 'd', e: 'g' })).toEqual({ PATH: 'a;b;c;d', e: 'g' })
      expect(Helpers.mergeEnv({ PATH: 'a;b', Path: 'c', a: 'b', c: 'd' }, { })).toEqual({ PATH: 'a;b;c', a: 'b', c: 'd' })
      platform = oldPlatform
    })
  })
  describe('mergePath', function() {
    it('merges multiple paths', function() {
      expect(Helpers.mergePath('a;b', 'c;d')).toBe('a;b;c;d')
    })
    it('does not include duplicates', function() {
      expect(Helpers.mergePath('a;b', 'a;c')).toBe('a;b;c')
    })
    it('does not include empty stuff', function() {
      expect(Helpers.mergePath('', '')).toBe('')
      expect(Helpers.mergePath('a;', '')).toBe('a')
      expect(Helpers.mergePath('a;', ';c')).toBe('a;c')
    })
    it('trims the stuff included', function() {
      expect(Helpers.mergePath('; a ; b ; c ; d ;', 'g ; e')).toBe('a;b;c;d;g;e')
    })
  })
  describe('shouldNormalizeForWindows', function() {
    function shouldNormalizeForWindows(filePath: string, options: Object) {
      return Helpers.shouldNormalizeForWindows(filePath, options)
    }

    it('returns false on any other os', function() {
      const oldPlatform = process.platform
      let platform = 'darwin'
      // $FlowIgnore: Flow is dumb?
      Object.defineProperty(process, 'platform', {
        get() {
          return platform
        },
      })
      expect(shouldNormalizeForWindows('cmd', {})).toBe(false)
      expect(shouldNormalizeForWindows('bash', {})).toBe(false)
      platform = oldPlatform
    })
    it('returns true on windows', function() {
      const oldPlatform = process.platform
      let platform = 'win32'
      // $FlowIgnore: Flow is dumb?
      Object.defineProperty(process, 'platform', {
        get() {
          return platform
        },
      })
      expect(shouldNormalizeForWindows('cmd', {})).toBe(false)
      expect(shouldNormalizeForWindows('cmd.exe', {})).toBe(false)
      expect(shouldNormalizeForWindows('bash.exe', {})).toBe(true)
      expect(shouldNormalizeForWindows('ding', {})).toBe(true)
      expect(shouldNormalizeForWindows('ding', { shell: true })).toBe(false)
      platform = oldPlatform
    })
  })
})
