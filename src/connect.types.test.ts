// Type-level tests for connect()
// Validated by: tsc --noEmit -p tsconfig.types.json
// Lines with @ts-expect-error MUST fail - if they don't, tsc errors.
// Lines without it MUST pass - if they don't, tsc errors.

import { connect } from './connect'

type MyEvents = {
  'chat': { text: string, user: string }
  'player-join': { playerId: string, team: string }
  'player-leave': { playerId: string }
  'message': number[] | Record<string, any>
}

// stricter variant without broad Record<string, any> in message
type StrictEvents = {
  'chat': { text: string, user: string }
  'move': { x: number, y: number }
}

// ─── UNTYPED (no Events generic) ─────────────────────────────

const raw = connect('my-channel')

// send accepts anything
raw.send({ type: 'chat', text: 'Hello', user: 'John' })
raw.send([1, 2, 3])
raw.send('hello')
raw.send(42)

// send accepts inline generic
raw.send<{ type: 'chat', text: string }>({ type: 'chat', text: 'hi' })

// chaining works through .on and .send
connect('my-channel')
  .on('chat', ({ text, user, date, uid }) => {})
  .on('leave', ({ users }) => {})
  .send({ type: 'chat', text: 'Hello', user: 'John' })
  .send([1, 2, 3])

// inline generic on .on works
connect('my-channel')
  .on<{ text: string, user: string }>('chat', ({ text, user, date, uid }) => {})
  .send<{ type: 'chat', text: string, user: string }>({ type: 'chat', text: 'Hello', user: 'John' })
  .send<number[]>([1, 2, 3])

// push works the same as send
raw.push({ anything: true })
raw.push('hello')

// itty protocol events available on channel connections
raw.on('join', (e) => { e.users })
raw.on('leave', (e) => { e.users })
raw.on('error', (e) => { e.message })

// open/close listeners take no args
raw.on('open', () => {})
raw.on('close', () => {})

// unknown event types accepted with loose typing
raw.on('anything', (e) => { e.type })
raw.on('custom-event', (e) => { e.whatever })

// filter function as type
raw.on((e: any) => e.foo, (e) => {})

// remove
raw.remove('chat', () => {})

// uid param on send (itty protocol)
raw.send('hello', 'some-uid')
raw.push('hello', 'some-uid')

// ─── TYPED (with Events generic) ─────────────────────────────

const typed = connect<MyEvents>('my-channel')

// valid typed sends
typed.send({ type: 'chat', text: 'hi', user: 'John' })
typed.send({ type: 'player-join', playerId: '1', team: 'Red' })
typed.send({ type: 'player-leave', playerId: '1' })
typed.send([1, 2, 3])  // matches message: number[]
typed.send({ foo: 'bar' })  // matches message: Record<string, any>

// typed .on gives correct event shape
typed.on('chat', (e) => {
  const _text: string = e.text
  const _user: string = e.user
  const _type: 'chat' = e.type
  const _date: number = e.date  // from IttyProtocol base
})

typed.on('player-join', (e) => {
  const _id: string = e.playerId
  const _team: string = e.team
})

// message listener gets base + message
typed.on('message', (e) => {
  const _msg = e.message
})

// unknown event types still accepted on typed connections (catch-all)
typed.on('unknown-event', (e) => { e.type })

// chaining through typed events
connect<MyEvents>('my-channel')
  .on('chat', ({ text, user }) => {})
  .send({ type: 'chat', text: 'Hello', user: 'John' })

// NOTE: these SHOULD fail but don't, because message: Record<string, any>
// is too broad — it swallows arbitrary objects. Use StrictEvents to test rejection.
typed.send({ type: 'chat', text: 'hi' })  // missing 'user' but matches Record<string, any>
typed.send({ type: 'nonexistent' })        // matches Record<string, any>

// @ts-expect-error - plain string is not a valid event
typed.send('hello')

// @ts-expect-error - plain number is not a valid event
typed.send(42)

// ─── STRICT TYPED (no broad Record in message) ──────────────

const strict = connect<StrictEvents>('my-channel')

// valid strict sends
strict.send({ type: 'chat', text: 'hi', user: 'John' })
strict.send({ type: 'move', x: 1, y: 2 })

// @ts-expect-error - missing required field 'user' on chat
strict.send({ type: 'chat', text: 'hi' })

// @ts-expect-error - wrong type value
strict.send({ type: 'nonexistent' })

// @ts-expect-error - plain string not valid
strict.send('hello')

// @ts-expect-error - plain number not valid
strict.send(42)

// @ts-expect-error - wrong field types
strict.send({ type: 'move', x: 'not a number', y: 2 })

// ─── EXTERNAL WebSocket (ws:// or wss://) ────────────────────

const external = connect('wss://example.com')

// untyped external sends anything
external.send({ foo: 'bar' })
external.send('hello')

// unknown event types accepted via generic catch-all (loose typing)
external.on('join', (e) => { e.type })
external.on('leave', (e) => { e.type })
external.on('anything', (e) => { e.type })

// no uid param on external send
// @ts-expect-error - external send does not accept uid
external.send('hello', 'some-uid')

// open/close still work on external
external.on('open', () => {})
external.on('close', () => {})

// typed external
const typedExternal = connect<MyEvents>('wss://example.com')

typedExternal.send({ type: 'chat', text: 'hi', user: 'John' })

// @ts-expect-error - typed external rejects invalid sends too
typedExternal.send('hello')
