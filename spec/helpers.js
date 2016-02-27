'use babel'

// Our sugar method that allows us to pass async functions and do await in it
export function it(name, callback) {
  global.it(name, function() {
    const value = callback()
    if (value && value.constructor.name === 'Promise') {
      waitsForPromise(function() {
        return value
      })
    }
  })
}
