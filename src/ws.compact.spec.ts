import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test'
import { ws } from './ws'

describe('ws', () => {
  let mockWs: any
  const TEST_URL = 'ws://test.com'
  let instanceCounter = 0

  const setup = () => {
    mockWs = {
      send: mock(() => {}),
      close: mock(() => {}),
      readyState: 0, // Start as CONNECTING
      onopen: null,
      onclose: null,
      onmessage: null,
    }
    // @ts-ignore
    global.WebSocket = mock(function(this: any) {
      const instance = {
        ...mockWs,
        instanceId: ++instanceCounter
      }
      Object.assign(this, instance)
      mockWs.instance = this
      // Simulate successful connection
      setTimeout(() => {
        this.readyState = 1 // OPEN
        this.onopen?.()
      }, 0)
      return this
    })
    return ws(TEST_URL)
  }

  beforeEach(() => {
    instanceCounter = 0
  })

  // @ts-ignore - Cleanup global mock
  afterEach(() => global.WebSocket = undefined)

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
          run: conn => {
            conn.send('test') // Trigger connection
            expect(conn.ws).toBe(mockWs.instance)
            expect(typeof conn.ws?.send).toBe('function')
            expect(typeof conn.ws?.close).toBe('function')
          }
        },
        {
          name: 'reconnects on send after close',
          run: async conn => {
            conn.send('test')
            await new Promise(resolve => setTimeout(resolve, 0))
            conn.close()
            mockWs.instance.onclose()
            conn.push('test')
            expect(conn.ws?.readyState).toBe(0) // Should be CONNECTING
            await new Promise(resolve => setTimeout(resolve, 0))
            expect(conn.ws?.readyState).toBe(1) // Should be OPEN
          }
        },
        {
          name: 'reconnects on push after close',
          run: async conn => {
            // Initial connection
            conn.send('test')
            await new Promise(resolve => setTimeout(resolve, 0)) // Wait for onopen
            const firstId = conn.ws?.instanceId
            // Close the connection
            conn.close()
            mockWs.instance.readyState = 3 // CLOSED (simulate WebSocket behavior)
            mockWs.instance.onclose() // Trigger onclose to clear ws
            // Send again to trigger reconnect
            conn.send('test')
            expect(conn.ws?.readyState).toBe(0) // Should be CONNECTING
            expect(conn.ws?.instanceId).not.toBe(firstId) // Should be a new instance
            await new Promise(resolve => setTimeout(resolve, 0)) // Wait for new onopen
            expect(conn.ws?.readyState).toBe(1) // Should be OPEN
          }
        },
        {
          name: 'should reconnect on listen after close',
          run: conn => {
            conn.send('test') // Initial connection
            conn.close()
            conn.listen(() => {})
            expect(conn.ws?.readyState).toBe(0)
          }
        }
      ]
    },
    {
      group: 'message handling',
      cases: [
        {
          name: 'notifies listeners',
          run: conn => {
            const listener = mock(() => {})
            conn.listen(listener)
            mockWs.instance.onmessage?.({ data: 'test' })
            expect(listener).toHaveBeenCalledWith('test')
          }
        },
        {
          name: 'handles json option for sending',
          run: () => {
            const conn = ws(TEST_URL, { json: true })
            const data = { hello: 'world' }
            conn.send(data)
            mockWs.instance.onopen?.()
            expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(data))
          }
        },
        {
          name: 'auto-parses json messages when json option is true',
          run: () => {
            const conn = ws(TEST_URL, { json: true })
            const listener = mock(() => {})
            const payload = { foo: 'bar', num: 123 }

            conn.listen(listener)
            mockWs.instance.onmessage?.({ data: JSON.stringify(payload) })

            expect(listener).toHaveBeenCalledWith(payload)
            expect(listener).not.toHaveBeenCalledWith(JSON.stringify(payload))
          }
        }
      ]
    },
    {
      group: 'push and close',
      cases: [
        {
          name: 'push sends and closes',
          run: conn => {
            conn.push('test')
            conn.ws.onclose(() => {
              expect(mockWs.send).toHaveBeenCalledWith('test')
            })
          }
        },
        {
          name: 'close sets readyState to CLOSED',
          run: async conn => {
            conn.send('test') // Establish connection
            conn.ws.onclose = () => {
              expect(conn.ws.readyState).toBe(3) // CLOSED
            }
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