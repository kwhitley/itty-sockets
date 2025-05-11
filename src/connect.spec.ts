import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test'
import { connect, MessageEvent, type IttySocket } from './connect'

const MAX_TIMEOUT = 250

type Test = {
  name: string
  run?: (node: IttySocket) => void
  cases?: Test[]
}

describe('connect(id, options?)', () => {
  const getChannelID = () => 'itty:itty-sockets:test-' + Math.random().toString(36).slice(2)
  const setup = () => connect(getChannelID(), { echo: true })

  const tests: Test[] = [
    {
      name: 'exposes methods',
      cases: [
        {
          name: 'exposes .send, .push, .on, .close, .open',
          run: (channel: IttySocket) => {
            for (const method of ['send', 'push', 'on', 'close', 'open']) {
              expect(typeof channel[method]).toBe('function')
            }
          }
        }
      ]
    },
    {
      name: 'server options',
      cases: [
        {
          name: 'echo > sends messages back to sender',
          run: () => new Promise<void>((resolve, reject) => {
            const channel = connect(getChannelID(), { echo: true })

            channel.on('message', msg => {
              expect(msg.message).toBe('test')
              channel.close()
              resolve()
            })
            channel.send('test')
          })
        },
        {
          name: 'as > sets alias for messages',
          run: () => new Promise<void>((resolve, reject) => {
            const channel = connect(getChannelID(), { echo: true, as: 'test-user' })
            const timeout = setTimeout(() => reject(new Error('No message received')), MAX_TIMEOUT)

            channel.on('message', msg => {
              clearTimeout(timeout)
              expect(msg.alias).toBe('test-user')
              channel.close()
              resolve()
            })
            channel.send('test')
          })
        }
      ]
    },
    {
      name: '.open()',
      cases: [
        {
          name: 'returns the socket',
          run: (channel: IttySocket) => expect(channel.open()).toBe(channel)
        },
        {
          name: 'opens the socket',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            channel.on('open', () => {
              expect(true).toBe(true)
              resolve()
            })
            channel.open()
          })
        }
      ]
    },
    {
      name: '.close()',
      cases: [
        {
          name: 'returns the socket',
          run: (channel: IttySocket) => expect(channel.close()).toBe(channel)
        },
        {
          name: 'closes the socket',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            channel
              .on('close', () => {
                expect(true).toBe(true)
                resolve()
              })
              .on('open', () => {
                channel.close()
              })
              .open()
          })
        }
      ]
    },
    {
      name: `.on('open', listener)`,
      cases: [
        {
          name: 'returns the socket',
          run: (channel: IttySocket) => {
            expect(channel.on('close', () => {})).toBe(channel)
          }
        },
        {
          name: 'registers an event listener that is called when the socket is opened',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            channel
              .on('open', () => {
                expect(true).toBe(true)
                resolve()
              })
              .open()
          })
        },
        {
          name: 'only allows one open listener (will replace any existing one)',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            const spy1 = mock(() => {})
            const spy2 = mock(() => {
              expect(spy1).not.toHaveBeenCalled()
              resolve()
            })

            channel
              .on('open', spy1)
              .on('open', spy2)
              .open()
          })
        }
      ]
    },
    {
      name: `.on('close', listener)`,
      cases: [
        {
          name: 'returns the socket',
          run: (channel: IttySocket) => {
            expect(channel.on('close', () => {})).toBe(channel)
          }
        },
        {
          name: 'registers an event listener that is called when the socket is closed',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            const spy = mock(() => {})

            channel
              .on('close', spy)
              .on('open', () => {
                channel.close()
                expect(spy).toHaveBeenCalled()
                resolve()
              })
              .open()
          })
        },
        {
          name: 'only allows one close listener (will replace any existing one)',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            const spy1 = mock(() => {})
            const spy2 = mock(() => {})
            channel
              .on('close', spy1)
              .on('close', spy2)
              .on('open', () => {
                channel.close()
                expect(spy1).not.toHaveBeenCalled()
                expect(spy2).toHaveBeenCalled()
                resolve()
              })
              .open()
          })
        }
      ]
    },
    {
      name: `.on('message', messageListener)`,
      cases: [
        {
          name: 'returns the socket',
          run: (channel: IttySocket) => {
            expect(channel.on('close', () => {})).toBe(channel)
          }
        },
        {
          name: 'registers an event listener that is called when a message is received',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            const spy = mock(() => {})

            channel
              .on('message', e => {
                expect(e.message).toBe('test')
                channel.close()
                resolve()
              })
              .send('test')
          })
        },
        {
          name: 'allows multiple message listeners',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            const spy1 = mock((e) => {})
            const spy2 = mock((e) => {
              expect(e.message).toBe('test')
              expect(spy1).toHaveBeenCalled()
              channel.close()
              resolve()
            })

            channel
              .on('message', spy1)
              .on('message', spy2)
              .send('test')
          })
        }
      ]
    },
    {
      name: '.send(message, recipient?)',
      cases: [
        {
          name: 'returns the socket',
          run: (channel: IttySocket) => {
            expect(channel.send('test')).toBe(channel)
          }
        }
      ]
    },

    {
      name: 'message handling',
      cases: [
        {
          name: 'MessageEvent > includes expected fields',
          run: () => new Promise<void>((resolve, reject) => {
            const channel = setup()
            const timeout = setTimeout(() => reject(new Error('No message received')), MAX_TIMEOUT)

            channel.on('message', msg => {
              clearTimeout(timeout)
              expect(msg.date instanceof Date).toBe(true)
              expect(typeof msg.uid).toBe('string')
              expect(msg.message).toBe('test')
              channel.close()
              resolve()
            })
            channel.send('test')
          })
        },
        {
          name: 'sends private messages to recipient',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            const recipient = 'user-' + Math.random().toString(36).slice(2)
            const message = 'private-message'

            channel
              .on('message', e => {
                expect(e.uid).toBeUndefined()
                expect(e.message).toContain(recipient)
                channel.close()
                resolve()
              })
              .send(message, recipient)
          })
        },
        {
          name: 'handles multiple listeners for same message',
          run: (channel: IttySocket) => new Promise<void>((resolve) => {
            let count = 0
            const listener1 = mock(() => count++)
            const listener2 = mock(() => count++)

            channel
              .on('message', listener1)
              .on('message', listener2)
              .send('test') // trigger the echo

            setTimeout(() => {
              expect(count).toBe(2)
              expect(listener1).toHaveBeenCalled()
              expect(listener2).toHaveBeenCalled()
              channel.close()
              resolve()
            }, 150)
          })
        }
      ]
    },
    {
      name: 'message queueing',
      cases: [
        {
          name: 'processes queued messages in order',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            const messages = ['first', 'second', 'third']
            const received: any[] = []
            const timeout = setTimeout(() => reject(new Error('Queue timeout')), MAX_TIMEOUT)

            channel.on('message', msg => {
              received.push(msg.message)
              if (received.length === messages.length) {
                clearTimeout(timeout)
                expect(received).toEqual(messages)
                channel.close()
                resolve()
              }
            })

            messages.forEach(msg => channel.send(msg))
          })
        }
      ]
    },
    {
      name: 'push behavior',
      cases: [
        {
          name: 'sends message and closes immediately',
          run: async () => {
            const cid = getChannelID()
            const channel = connect(cid)
            const receiver = connect(cid)
            const message = 'push-test'

            return new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Push timeout')), MAX_TIMEOUT)

              receiver.on('message', msg => {
                clearTimeout(timeout)
                expect(msg.message).toBe(message)

                setTimeout(() => {
                  receiver.close()
                  resolve()
                }, 50)
              })

              channel.push(message)
            })
          }
        }
      ]
    },
  ]

  const runTests = (tests: Test[]) => {
    for (const test of tests) {
      if (test.cases?.length) {
        // @ts-ignore
        describe(test.name, () => runTests(test.cases))
      } else if (test.run) {
        it(test.name, () => test.run?.(setup()))
      }
    }
  }

  runTests(tests)
})