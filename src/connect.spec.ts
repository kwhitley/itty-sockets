import { describe, afterAll, expect, it, mock } from 'bun:test'
import { connect, type IttySocket, type IttyProtocol } from './connect'

type TestLeaf = (args: {
  channel: IttySocket<IttyProtocol>,
  resolve: () => void,
  spy: () => void,
  getChannel: (options?: any) => IttySocket<IttyProtocol>
}) => void

type TestTree = {
  [key: string]: TestTree | TestLeaf
}

type ChatMessage = {
  type: 'chat',
  user: string,
  text: string,
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
    'constructs correct WebSocket URL': () => {
      const originalWebSocket = global.WebSocket
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockFn = mock((url: string) => ({}))

      // @ts-ignore
      global.WebSocket = mockFn

      connect('my-channel', { a: 'b', c: 'd' } as any).open()
      expect(mockFn.mock.calls[0][0]).toBe('wss://itty.ws/c/my-channel?a=b&c=d')

      connect('ws://custom.server/path').open()
      expect(mockFn.mock.calls[1][0]).toBe('ws://custom.server/path?')

      connect('ws://custom.server/path', { echo: true, alias: 'test-user' }).open()
      expect(mockFn.mock.calls[2][0]).toBe('ws://custom.server/path?echo=true&alias=test-user')

      global.WebSocket = originalWebSocket
    },
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
            .send('test'),
        'sets alias for join events if { announce: true } is set': async ({ getChannel, resolve }) =>
          getChannel({ echo: true, alias: 'test-user', announce: true })
            .on('join', ({ alias }) => {
              expect(alias).toBe('test-user')
              resolve()
            }),
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
        'receives message props on base message object': async ({ getChannel, resolve }) =>
          getChannel({ echo: true })
            .on<{ foo: string }>('message', (e) => {
              expect(e.foo).toBe('bar')
              expect(e.message.foo).toBe('bar')
              resolve()
            })
            .send({ foo: 'bar' }),
        'message props do not override event base props': async ({ getChannel, resolve }) =>
          getChannel({ echo: true, alias: 'test-user' })
            .on<{ foo: string }>('message', (e) => {
              expect(e.foo).toBe('bar')
              // confirm types are correct
              expect(e.uid).toBeTypeOf('string')
              expect(e.alias).toBeTypeOf('string')
              expect(e.date).toBeTypeOf('number')
              // confirm props are not overridden
              expect(e.uid).not.toBe('foo')
              expect(e.alias).not.toBe('bar')
              expect(e.date).not.toBe(12345)
              resolve()
            })
            .send({ foo: 'bar', uid: 'foo', alias: 'bar', date: 12345 }),
        'base props not polluted by string messages': async ({ getChannel, resolve, spy }) =>
          getChannel({ echo: true })
            .on('message', spy)
            .on('message', (e) => {
              expect(e[0]).toBeUndefined() // "h" if polluted
              expect(spy).toHaveBeenCalled()
              resolve()
            })
            .send('hello'),
        'base props not polluted by array messages': async ({ getChannel, resolve, spy }) =>
          getChannel({ echo: true })
            .on('message', spy)
            .on('message', (e) => {
              expect(e[0]).toBeUndefined() // "1" if polluted
              expect(spy).toHaveBeenCalled()
              resolve()
            })
            .send([1, 2, 3]),
        'base props not polluted by numeric messages': async ({ getChannel, resolve, spy }) =>
          getChannel({ echo: true })
            .on('message', spy)
            .on('message', (e) => {
              expect(e[0]).toBeUndefined() // "?" if polluted
              expect(spy).toHaveBeenCalled()
              resolve()
            })
            .send(13),
      },
      '.on(\'join\', listener)': {
        'registers an event listener that is called when a user (or self) joins the channel': async ({ channel, resolve }) =>
          channel
            .on('join', e => {
              expect(e.total).toBe(1)
              resolve()
            }),
        'self join always includes uid': async ({ channel, resolve }) =>
          channel
            .on('join', e => {
              expect(e.self).toBe(true)
              expect(e.uid).toBeTypeOf('string')
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
      '.on(\'error\', listener)': {
        'registers an event listener that is called when an error occurs': async ({ channel, resolve }) =>
          channel
            .on('error', e => {
              expect(e.message).toContain('non-existent-user')
              resolve()
            })
            .send('test', 'non-existent-user')
      },
      '.on(\'leave\', listener)': {
        'registers an event listener that is called when a user leaves the channel': async ({ channel, getChannel,resolve }) => {
            channel
              .on('leave', e => {
                expect(e.total).toBe(1)
                resolve()
              })
              .on('open', () => {
                getChannel().push('test') // trigger a join + leave
              })
        },
        'does NOT include user details when { announce: true } is not set': async ({ channel, getChannel, resolve }) => {
          channel
            .on('leave', e => {
              expect(e.uid).toBeUndefined()
              expect(e.alias).toBeUndefined()
              resolve()
            })
            .on('open', () => {
              getChannel().push('test') // trigger a join + leave
            })
        },
        'DOES include user details when { announce: true } is set': async ({ getChannel, resolve }) => {
          getChannel()
            .on('leave', e => {
              expect(e.uid).not.toBeUndefined()
              expect(e.alias).toBe('test-user')
              resolve()
            })
            .on('open', () => {
              getChannel({ announce: true, alias: 'test-user' }).push('test') // trigger a join + leave
            })
        }
      },
      '.on(\'{custom-type}\', listener)': {
        'catches when message.type matches the custom type': async ({ getChannel, resolve }) => {
           getChannel()
             .on<{ user: string, text: string }>('chat', (e) => {
                const { user, text } = e
                expect(user).toBe('test-user')
                expect(text).toBe('test')
                expect(e.type).toBe('chat') // currently giving a TS error (incorrect)
                expect(e.uid).toBeTypeOf('string')
                expect(e.date).toBeTypeOf('number')
                expect(e.user).toBe(e.message.user)
                resolve()
              })
              .on('open', () => {
                getChannel().send({ type: 'chat', user: 'test-user', text: 'test' })
              })
        },
        'will still trigger "message" listeners': async ({ getChannel, resolve, spy }) =>
          getChannel({ echo: true })
            .on('message', spy)
            .on('chat', () => {
              setTimeout(() => {
                expect(spy).toHaveBeenCalled()
                resolve()
              }, 5)
            })
            .send({ type: 'chat', user: 'test-user', text: 'test' }),
        'will include custom payloads at top level and under e.message': async ({ getChannel, resolve, spy }) =>
          getChannel({ echo: true })
            .on('message', spy)
            .on<ChatMessage>('chat', (e) => {
               expect(e.type).toBe('chat')
               expect(e.user).toBe('test-user')
               expect(e.text).toBe('test')
               expect(e.message.type).toBe('chat')
               expect(e.message.user).toBe('test-user')
               expect(e.message.text).toBe('test')
               resolve()
            })
            .send({ type: 'chat', user: 'test-user', text: 'test' })
      },
      '.on(\'*\', listener)': {
        'catches both typed and untyped events': async ({ getChannel, resolve }) => {
          const received: any[] = []
          getChannel({ echo: true })
            .on('*', (e) => {
              received.push(e)
              if (received.length === 2) {
                expect(received[0].type).toBe('join')
                expect(received[1].message).toBe('test')
                resolve()
              }
            })
            .send('test')
        },
      },
      '.on(eventFilter, listener)': {
        'can accept a filter function as type': async ({ getChannel, resolve, spy }) =>
          getChannel({ echo: true })
            .on('message', spy)
            .on(e => e.type === 'chat', () => {
              setTimeout(() => {
                expect(spy).toHaveBeenCalled()
                resolve()
              }, 5)
            })
            .send({ type: 'chat', user: 'test-user', text: 'test' }),
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
            .on('open', () => {
              getChannel().send('test')
            })
        },
        'delivers a message to a recipient': async ({ channel, getChannel, resolve }) => {
          channel
            .on('join', ({ uid, self }) => {
              if (!self) channel.send('test', uid)
            })
            .on('open', () => {
              getChannel({ announce: true })
                .on('message', (e) => {
                  expect(e.message).toBe('test')
                  resolve()
                })
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
              getChannel()
                .on('message', spy)
                .on('open', () => {
                  getChannel({ announce: true, alias: 'test-user' })
                    .on('message', (e) => {
                      expect(e.message).toBe('test')
                      expect(spy).not.toHaveBeenCalled()
                      resolve()
                    })
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
            .on('open', () => {
              getChannel().push('test')
            })
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
              expect(e.total).toBe(1)
              expect(e.self).toBe(true)
              expect(e.uid).toBeTypeOf('string')
              expect(e.alias).toBeUndefined()
              expect(e.date).toBeTypeOf('number')
              resolve()
            }),
        'with { announce: true }': async ({ getChannel, resolve }) =>
          getChannel({ announce: true, as: 'test-user' })
            .on('join', e => {
              expect(e.total).toBe(1)
              expect(e.uid).toBeTypeOf('string')
              expect(e.alias).toBe('test-user')
              expect(e.date).toBeTypeOf('number')
              resolve()
            })
      },
      'leave': {
        'default': async ({ channel, getChannel, resolve }) => {
          channel
            .on('leave', e => {
              expect(e.total).toBe(1)
              expect(e.uid).toBeUndefined()
              expect(e.alias).toBeUndefined()
              expect(e.date).toBeTypeOf('number')
              resolve()
            })
            .on('open', () => {
              getChannel().push('test')
            })
        },
        'with { announce: true }': async ({ getChannel, resolve }) => {
          getChannel()
            .on('leave', e => {
              expect(e.total).toBe(1)
              expect(e.uid).toBeTypeOf('string')
              expect(e.alias).toBe('test-user')
              expect(e.date).toBeTypeOf('number')
              resolve()
            })
            .on('open', () => {
              getChannel({ announce: true, as: 'test-user' }).push('test')
            })
        }
      },
      'message': {
        'default': async ({ getChannel, resolve }) =>
          getChannel({ echo: true })
            .on('message', e => {
              expect(e.message).toBe('test')
              expect(e.uid).toBeTypeOf('string')
              expect(e.alias).toBeUndefined()
              expect(e.date).toBeTypeOf('number')
              resolve()
            })
            .send('test'),
        'with { alias: string } includes users alias in payload': async ({ getChannel, resolve }) =>
          getChannel({ echo: true, alias: 'test-user' })
            .on('message', e => {
              expect(e.message).toBe('test')
              expect(e.uid).toBeTypeOf('string')
              expect(e.alias).toBe('test-user')
              expect(e.date).toBeTypeOf('number')
              resolve()
            })
            .send('test'),
      },
    }
  }
}

// setup function for each test
const WS_URL = process.env.WS_URL // e.g. ws://localhost:2222/c/

const setup = () => {
  const room = 'itty:itty-sockets:test-' + Math.random().toString(36).slice(2)
  const id = WS_URL ? WS_URL + room : room
  const getChannel = (options = {}): IttySocket<IttyProtocol> => {
    const channel = connect(id, options)
    OPEN_CHANNELS.push(channel)
    return channel
  }

  return {
    getChannel,
    channel: getChannel() as IttySocket<IttyProtocol>,
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

// type tests
it('types', async () => {
  const result = Bun.spawnSync(['bunx', 'tsc', '-p', 'tsconfig.types.json'])
  if (result.exitCode) throw new Error(result.stderr.toString())
})

// close any open channels
afterAll(() => {
  console.log(`closing ${OPEN_CHANNELS.length} channels`)
  OPEN_CHANNELS.forEach(channel => channel.close())
})
