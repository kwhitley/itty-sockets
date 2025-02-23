import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { connect, MessageEvent, type IttySocket } from './connect'

const MAX_TIMEOUT = 250

describe('connect', () => {
  const getChannelID = () => 'itty:itty-sockets:test-' + Math.random().toString(36).slice(2)
  const setup = () => connect(getChannelID(), { echo: true })

  const tests = [
    {
      group: 'methods',
      cases: [
        {
          name: 'exposes .send, .push, .listen, .close',
          run: (channel: IttySocket) => {
            for (const method of ['send', 'push', 'listen', 'close']) {
              expect(typeof channel[method]).toBe('function')
            }
          }
        }
      ]
    },
    {
      group: 'server options',
      cases: [
        {
          name: 'echo > sends messages back to sender',
          run: () => new Promise<void>((resolve, reject) => {
            const channel = connect(getChannelID(), { echo: true })

            channel.listen(msg => {
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

            channel.listen(msg => {
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
      group: 'message handling',
      cases: [
        {
          name: 'MessageEvent > includes expected fields',
          run: () => new Promise<void>((resolve, reject) => {
            const channel = setup()
            const timeout = setTimeout(() => reject(new Error('No message received')), MAX_TIMEOUT)

            channel.listen(msg => {
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
          name: 'handles conditional message listening',
          run: () => new Promise<void>((resolve, reject) => {
            const channel = setup()
            let receivedCount = 0
            const timeout = setTimeout(() => reject(new Error('Test timeout')), MAX_TIMEOUT)

            channel.listen(
              msg => {
                receivedCount++
                if (receivedCount === 1) {
                  clearTimeout(timeout)
                  channel.close()
                  resolve()
                }
              },
              msg => msg.message.type === 'test'
            )

            channel.send({ type: 'test' })
            channel.send({ type: 'other' })
          })
        },
        {
          name: 'when predicate blocks messages',
          run: (channel: IttySocket) => new Promise<void>((resolve) => {
            let called = false
            channel
              .listen(
                () => { called = true },
                () => false // when predicate always returns false
              )
              .send('test')

            setTimeout(() => {
              expect(called).toBe(false)
              channel.close()
              resolve()
            }, 100)
          })
        },
        {
          name: 'sends private messages to recipient',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            const recipient = 'user-' + Math.random().toString(36).slice(2)
            const message = 'private-message'

            channel
              .listen(e => {
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
            const listener1 = () => count++
            const listener2 = () => count++

            channel
              .listen(listener1)
              .listen(listener2)
              .send('test')

            setTimeout(() => {
              expect(count).toBe(2)
              channel.close()
              resolve()
            }, 100)
          })
        }
      ]
    },
    {
      group: 'message queueing',
      cases: [
        {
          name: 'processes queued messages in order',
          run: (channel: IttySocket) => new Promise<void>((resolve, reject) => {
            const messages = ['first', 'second', 'third']
            const received: any[] = []
            const timeout = setTimeout(() => reject(new Error('Queue timeout')), MAX_TIMEOUT)

            channel.listen(msg => {
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
      group: 'push behavior',
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

              receiver.listen(msg => {
                clearTimeout(timeout)
                expect(msg.message).toBe(message)

                setTimeout(() => {
                  expect(channel.ws).toBeNull()
                  receiver.close()
                  resolve()
                }, 50)
              })

              channel.push(message)
            })
          }
        }
      ]
    }
  ]

  // Generate tests from data structure
  for (const { group, cases } of tests) {
    describe(group, () => {
      for (const { name, run } of cases) {
        it(name, () => run(setup()))
      }
    })
  }
})