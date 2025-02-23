import { describe, expect, it } from 'bun:test'
import { ws, type Connection, type ConnectionOptions } from './ws'

describe('ws', () => {
  const getURL = (id: string) =>
    `wss://ittysockets.io/r/itty:itty-sockets:test-${id}?echo=true`

  const setup = (options: ConnectionOptions = {}) => {
    const id = Math.random().toString(36).slice(2)
    return ws(getURL(id), options)
  }

  const tests = [
    {
      group: 'basics',
      cases: [
        {
          name: 'is a function',
          run: () => expect(typeof ws).toBe('function')
        },
        {
          name: 'returns proxy with methods',
          run: conn => ['send', 'push', 'listen', 'close'].forEach(
            method => expect(typeof conn[method]).toBe('function')
          )
        }
      ]
    },
    {
      group: 'connection behavior',
      cases: [
        {
          name: 'does not connect until triggered',
          run: conn => expect(conn.ws).toBeUndefined()
        },
        {
          name: 'exposes raw websocket after connection',
          run: () => new Promise<void>((resolve, reject) => {
            const conn = setup()
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 150)

            conn.listen(() => {
              clearTimeout(timeout)
              expect(conn.ws instanceof WebSocket).toBe(true)
              expect(typeof conn.ws?.send).toBe('function')
              expect(typeof conn.ws?.close).toBe('function')
              resolve()
            })

            conn.send('test')
          })
        },
        {
          name: 'reconnects after close',
          run: () => {
            const conn = setup({ json: true })
            conn
              .listen((e) => {
                if (e.message === 'end') {
                  expect(e.message).toBe('end')
                }
              })
              .send('start')
              .close()

            setTimeout(() => {
              conn.send('end')
            }, 50)
          }
        }
      ]
    },
    {
      group: 'message handling',
      cases: [
        {
          name: 'notifies listeners',
          run: () => new Promise<void>((resolve, reject) => {
            const conn = setup({ json: true })
            const timeout = setTimeout(() => reject(new Error('No message received')), 150)

            conn.listen(e => {
              clearTimeout(timeout)
              expect(e.message).toBe('test-message')
              resolve()
            })

            conn.send('test-message')
          })
        },
        {
          name: 'handles json option',
          run: () => new Promise<void>((resolve, reject) => {
            const conn = ws(getURL(Math.random().toString(36).slice(2)), { json: true })
            const data = { hello: 'world' }
            const timeout = setTimeout(() => reject(new Error('No message received')), 150)

            conn.listen(e => {
              clearTimeout(timeout)
              expect(e.message).toEqual(data)
              resolve()
            })

            conn.send(data)
          })
        }
      ]
    },
    {
      group: 'push behavior',
      cases: [
        {
          name: 'sends message and closes',
          run: async () => {
            const id = Math.random().toString(36).slice(2)
            const sender = ws(getURL(id), { json: true })
            const receiver = ws(getURL(id), { json: true })
            const message = 'push-test'

            return new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Push timeout')), 150)

              receiver.listen(e => {
                clearTimeout(timeout)
                expect(e.message).toBe(message)

                setTimeout(() => {
                  expect(sender.ws).toBeNull()
                  resolve()
                }, 50)
              })

              sender.push(message)
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