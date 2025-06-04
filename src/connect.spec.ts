import { describe, afterAll, expect, it, mock } from 'bun:test'
import { connect, type IttySocket } from './connect'

type TestLeaf = (args: {
  channel: IttySocket,
  resolve: () => void,
  spy: () => void,
  getChannel: (options?: any) => IttySocket
}) => void

type TestTree = {
  [key: string]: TestTree | TestLeaf
}

const EXPOSED_METHODS = ['send', 'push', 'on', 'remove', 'close', 'open']
const OPEN_CHANNELS: IttySocket[] = []

const tests: TestTree = {
  'NAMED EXPORTS': {
    'import { connect } from "itty-sockets"': {
      'is a function': () => expect(typeof connect).toBe('function'),
    },
  },
  'connect(id, options?)': {
    'exposes chainable method': EXPOSED_METHODS.reduce((acc, method) => {
        acc[`.${method}()`] = ({ channel }) => {
          expect(typeof channel[method]).toBe('function')
          expect(channel[method]()).toBe(channel)
        }
        return acc
      }, {} as Record<string, TestLeaf>),
    'OPTIONS': {
      '{ echo: true }': {
        'sends messages back to sender': async ({ getChannel, resolve }) =>
          getChannel({ echo: true })
            .on('message', msg => {
              expect(msg.message).toBe('test')
              resolve()
            })
            .send('test'),
      },
      '{ alias: string }': {
        'sets alias for messages': async ({ getChannel, resolve }) =>
          getChannel({ echo: true, alias: 'test-user' })
            .on('message', msg => {
              expect(msg.alias).toBe('test-user')
              resolve()
            })
            .send('test')
      },
      '{ as: string }': {
        'sets alias for messages': async ({ getChannel, resolve }) =>
          getChannel({ echo: true, as: 'test-user' })
            .on('message', msg => {
              expect(msg.alias).toBe('test-user')
              resolve()
            })
            .send('test')
      },
      '{ announce: true }': {
        'announces self to channel upon joining/leaving': async ({ getChannel, resolve }) =>
          getChannel({ announce: true, as: 'test-user' })
            .on('join', ({ alias }) => {
              expect(alias).toBe('test-user')
              resolve()
            })
      },
    },
    'METHODS': {
      '.open()': {
        'opens the socket': async ({ channel, resolve }) =>
          channel
            .on('open', resolve)
            .open(),
        'calling multiple times is fine': async ({ channel, resolve }) =>
          channel
            .on('open', () => {
              channel.open() // one more time for good measure
              resolve()
            })
            .open(),
      },
      '.close()': {
        'closes the socket': async ({ channel, resolve }) =>
          channel
            .on('close', resolve)
            .on('open', channel.close),
        'calling multiple times is fine': async ({ channel, resolve }) =>
          channel
            .on('close',resolve)
            .on('open', () => {
              channel.close()
              channel.close()
            }),
      },
      '.on(\'open\', listener)': {
        'registers an event listener that is called when the socket is opened': async ({ channel, resolve }) =>
          channel
            .on('open', resolve)
            .open(),
        'allows multiple listeners': async ({ channel, resolve, spy }) =>
          channel
            .on('open', spy)
            .on('open', () => {
              expect(spy).toHaveBeenCalled()
              resolve()
            }),
      },
      '.on(\'close\', listener)': {
        'registers an event listener that is called when the socket is closed': async ({ channel, resolve }) =>
          channel
            .on('close', resolve)
            .on('open', channel.close),
        'allows multiple listeners': async ({ channel, resolve, spy }) =>
          channel
            .on('close', spy)
            .on('close', () => {
              expect(spy).toHaveBeenCalled()
              resolve()
            })
            .on('open', channel.close),
      },
      '.on(\'message\', listener)': {
        'registers an event listener that is called when a message is received': async ({ getChannel, resolve }) => {
          getChannel({ echo: true })
            .on('message', e => {
              expect(e.message).toBe('test')
              resolve()
            })
            .send('test')
        },
        'allows multiple message listeners': async ({ getChannel, resolve, spy }) =>
          getChannel({ echo: true })
            .on('message', spy)
            .on('message', (e) => {
              expect(e.message).toBe('test')
              expect(spy).toHaveBeenCalled()
              resolve()
            })
            .send('test'),
      },
      '.on(\'join\', listener)': {
        'registers an event listener that is called when a user (or self) joins the channel': async ({ channel, resolve }) =>
          channel
            .on('join', e => {
              expect(e.users).toBe(1)
              resolve()
            }),
        'does NOT include user details when { announce: true } is not set': async ({ channel, resolve }) =>
          channel
            .on('join', e => {
              expect(e.uid).toBeUndefined()
              expect(e.alias).toBeUndefined()
              resolve()
            }),
        'DOES include user details when { announce: true } is set': async ({ getChannel, resolve }) =>
          getChannel({ announce: true, alias: 'test-user' })
            .on('join', e => {
              expect(e.uid).not.toBeUndefined()
              expect(e.alias).toBe('test-user')
              resolve()
            })
      },
      '.on(\'leave\', listener)': {
        'registers an event listener that is called when a user leaves the channel': async ({ channel, getChannel,resolve }) => {
            channel.on('leave', e => {
              expect(e.users).toBe(1)
              resolve()
            })
            getChannel().push('test') // trigger a join + leave
        },
        'does NOT include user details when { announce: true } is not set': async ({ channel, getChannel, resolve }) => {
          channel
            .on('leave', e => {
              expect(e.uid).toBeUndefined()
              expect(e.alias).toBeUndefined()
              resolve()
            })
          getChannel().push('test') // trigger a join + leave
        },
        'DOES include user details when { announce: true } is set': async ({ getChannel, resolve }) => {
          getChannel()
            .on('leave', e => {
              expect(e.uid).not.toBeUndefined()
              expect(e.alias).toBe('test-user')
              resolve()
            })
          getChannel({ announce: true, alias: 'test-user' }).push('test') // trigger a join + leave
        }
      },
      '.remove(\'open\', listener)': {
        'removes a listener (will not fire)': async ({ channel, resolve, spy }) =>
          channel
            .on('open', spy)
            .on('open', () => {
              expect(spy).not.toHaveBeenCalled()
              resolve()
            })
            .remove('open', spy)
      },
      '.send(message, recipient?)': {
        'delivers a message to the channel': async ({ channel, getChannel, resolve }) => {
          channel
            .on('message', e => {
              expect(e.message).toBe('test')
              resolve()
            })
          getChannel().send('test')
        },
        'delivers a message to a recipient': async ({ channel, getChannel, resolve }) => {
          channel
            .on('join', ({ uid }) => {
              channel.send('test', uid)
            })

          getChannel({ announce: true })
            .on('message', (e) => {
              expect(e.message).toBe('test')
              resolve()
            })
        },
        'private messages are ONLY delivered to the recipient': async ({ channel, getChannel, resolve, spy }) =>
          channel
            .on('join', ({ uid, alias }) => {
              if (alias === 'test-user') {
                channel.send('test', uid)
              }
            })
            .on('open', () => {
              getChannel().on('message', spy)

              getChannel({ announce: true, alias: 'test-user' })
                .on('message', (e) => {
                  expect(e.message).toBe('test')
                  expect(spy).not.toHaveBeenCalled()
                  resolve()
                })
            }),
        'will send an error if the recipient does not exist': async ({ channel, resolve }) =>
          channel
            .on('error', e => {
              expect(e.message).toContain('non-existent-user')
              resolve()
            })
            .send('test', 'non-existent-user'),
      },
      '.push(message, recipient?)': {
        'sends a message to the channel': async ({ channel, getChannel, resolve }) => {
          channel
            .on('message', e => {
              expect(e.message).toBe('test')
              resolve()
            })

          getChannel().push('test')
        },
        'closes after sending a message': async ({ channel, resolve }) =>
          channel
            .on('close', () => {
              resolve()
            })
            .push('test')
      },
    },
    'MISC BEHAVIOR': {
      'messages are queued and delivered upon connection': async ({ getChannel, resolve }) => {
        const messages = ['first', 'second', 'third']
        const received: string[] = []

        getChannel({ echo: true })
          .on('message', e => {
            received.push(e.message)

            if (received.length === messages.length) {
              expect(received).toEqual(messages)
              resolve()
            }
          })
          .send(messages[0])
          .send(messages[1])
          .send(messages[2])
      },
      'connection is opened when registering a listener': async ({ channel, resolve }) => channel.on('open', resolve),
    },
    'EVENT PAYLOADS': {
      'join': {
        'default': async ({ channel, resolve }) =>
          channel
            .on('join', e => {
              expect(e.users).toBe(1)
              expect(e.uid).toBeUndefined()
              expect(e.alias).toBeUndefined()
              expect(e.date).toBeInstanceOf(Date)
              resolve()
            }),
        'with { announce: true }': async ({ getChannel, resolve }) =>
          getChannel({ announce: true, as: 'test-user' })
            .on('join', e => {
              expect(e.users).toBe(1)
              expect(e.uid).toBeTypeOf('string')
              expect(e.alias).toBe('test-user')
              expect(e.date).toBeInstanceOf(Date)
              resolve()
            })
      },
      'leave': {
        'default': async ({ channel, getChannel, resolve }) => {
          channel
            .on('leave', e => {
              expect(e.users).toBe(1)
              expect(e.uid).toBeUndefined()
              expect(e.alias).toBeUndefined()
              expect(e.date).toBeInstanceOf(Date)
              resolve()
            })
          getChannel().push('test')
        },
        'with { announce: true }': async ({ channel,getChannel, resolve }) => {
          channel
            .on('leave', e => {
              expect(e.users).toBe(1)
              expect(e.uid).toBeTypeOf('string')
              expect(e.alias).toBe('test-user')
              expect(e.date).toBeInstanceOf(Date)
              resolve()
            })
          getChannel({ announce: true, as: 'test-user' }).push('test')
        }
      },
      'message': {
        'default': async ({ getChannel, resolve }) =>
          getChannel({ echo: true })
            .on('message', e => {
              expect(e.message).toBe('test')
              expect(e.uid).toBeTypeOf('string')
              expect(e.alias).toBeUndefined()
              expect(e.date).toBeInstanceOf(Date)
              resolve()
            })
            .send('test'),
        'with { alias: string }': async ({ getChannel, resolve }) =>
          getChannel({ echo: true, alias: 'test-user' })
            .on('message', e => {
              expect(e.message).toBe('test')
              expect(e.uid).toBeTypeOf('string')
              expect(e.alias).toBe('test-user')
              expect(e.date).toBeInstanceOf(Date)
              resolve()
            })
            .send('test'),
      },
    }
  }
}

// setup function for each test
const setup = () => {
  const id = 'itty:itty-sockets:test-' + Math.random().toString(36).slice(2)
  const getChannel = (options = {}) => {
    const channel = connect(id, options)
    OPEN_CHANNELS.push(channel)
    return channel
  }

  return {
    getChannel,
    channel: getChannel(id),
    spy: mock(() => {}),
  }
}

// recursive test runner
const runTests = (tests: TestTree) => {
  for (const [name, test] of Object.entries(tests)) {
    if (typeof test === 'function') {
      if (test.constructor.name === 'AsyncFunction') {
        // @ts-ignore
        it(name, () => new Promise(resolve => test({ ...setup(), resolve })))
      } else {
        // @ts-ignore
        it(name, () => test({ ...setup() }))
      }
    } else {
      describe(name, () => runTests(test))
    }
  }
}

// run the tests!
runTests(tests)

// close any open channels
afterAll(() => {
  console.log(`closing ${OPEN_CHANNELS.length} channels`)
  OPEN_CHANNELS.forEach(channel => channel.close())
})
