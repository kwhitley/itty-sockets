/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-expressions */
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

// @ts-expect-error - inline generic enforces shape
raw.send<{ type: 'chat', text: string }>({ type: 'chat', text: 1 })

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
raw.on('join', (e) => {
  const _users: number = e.users
  const _type: 'join' = e.type
})
raw.on('leave', (e) => {
  const _users: number = e.users
  const _type: 'leave' = e.type
})
raw.on('error', (e) => {
  const _message: string = e.message
  const _type: 'error' = e.type
})

// open/close listeners take no args
raw.on('open', () => {})
raw.on('close', () => {})

// unknown event types accepted with loose typing
raw.on('anything', (e) => {
  const _type: string = e.type
  const _message = e.message
})
raw.on('custom-event', (e) => { e.whatever })

// filter function as type
raw.on((e: any) => e.foo, (e) => {
  const _type: string = e.type
  const _message = e.message
})

// remove
raw.remove('chat', () => {})

// uid param on send (itty protocol)
raw.send('hello', 'some-uid')
raw.push('hello', 'some-uid')

// all methods return the socket (chainable)
raw.open().close().send('hi').on('open', () => {}).remove('open', () => {})

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
  const _date: number = e.date      // from IttyProtocol base
  const _uid: string = e.uid        // from IttyProtocol base
  const _message: MyEvents['chat'] = e.message
})

typed.on('player-join', (e) => {
  const _id: string = e.playerId
  const _team: string = e.team
  const _type: 'player-join' = e.type
  const _message: MyEvents['player-join'] = e.message

  // @ts-expect-error - wrong field from different event
  const _text: string = e.text
})

// message listener gets base + message
typed.on('message', (e) => {
  const _msg = e.message
  const _uid: string = e.uid        // from IttyProtocol base
  const _date: number = e.date
})

// itty protocol events still available on typed connections
typed.on('join', (e) => {
  const _users: number = e.users
  const _type: 'join' = e.type
})
typed.on('leave', (e) => {
  const _users: number = e.users
})
typed.on('error', (e) => {
  const _message: string = e.message
})

// unknown event types still accepted on typed connections (catch-all)
typed.on('unknown-event', (e) => {
  const _type: string = e.type
  const _message = e.message
})

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

// @ts-expect-error - plain boolean is not a valid event
typed.send(true)

// ─── STRICT TYPED (no broad Record in message) ──────────────

const strict = connect<StrictEvents>('my-channel')

// valid strict sends
strict.send({ type: 'chat', text: 'hi', user: 'John' })
strict.send({ type: 'move', x: 1, y: 2 })

// strict .on gives correct event shape
strict.on('chat', (e) => {
  const _text: string = e.text
  const _user: string = e.user
  const _type: 'chat' = e.type
  const _date: number = e.date
  const _message: StrictEvents['chat'] = e.message
})

strict.on('move', (e) => {
  const _x: number = e.x
  const _y: number = e.y
  const _message: StrictEvents['move'] = e.message

  // @ts-expect-error - wrong field from different event
  const _text: string = e.text
})

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

// @ts-expect-error - extra fields without matching type
strict.send({ type: 'chat', text: 'hi', user: 'John', extra: true })

// push also enforces types
strict.push({ type: 'chat', text: 'hi', user: 'John' })

// @ts-expect-error - push rejects invalid sends too
strict.push('hello')

// uid param on send (itty protocol)
strict.send({ type: 'chat', text: 'hi', user: 'John' }, 'some-uid')

// ─── EXTERNAL WebSocket (ws:// or wss://) ────────────────────

const external = connect('wss://example.com')

// untyped external sends anything
external.send({ foo: 'bar' })
external.send('hello')
external.send(42)
external.send([1, 2, 3])

// unknown event types accepted via generic catch-all (loose typing)
external.on('join', (e) => { e.type })
external.on('leave', (e) => { e.type })
external.on('anything', (e) => { e.type })

// external .on events get generic shape (no IttyProtocol base)
external.on('foo', (e) => {
  const _type: string = e.type
  const _message = e.message
})

// no uid param on external send
// @ts-expect-error - external send does not accept uid
external.send('hello', 'some-uid')

// open/close still work on external
external.on('open', () => {})
external.on('close', () => {})

// message listener works on external
external.on('message', (e) => {
  const _msg = e.message
})

// message listener with inline generic spreads T at top level and under message
external.on<{ foo: string }>('message', (e) => {
  const _foo: string = e.foo
  const _msgFoo: string = e.message.foo
})

// filter function works on external
external.on((e: any) => e.foo, (e) => {
  const _type: string = e.type
})

// typed external
const typedExternal = connect<MyEvents>('wss://example.com')

typedExternal.send({ type: 'chat', text: 'hi', user: 'John' })

// typed external .on gives correct shape
typedExternal.on('chat', (e) => {
  const _text: string = e.text
  const _user: string = e.user
  const _type: 'chat' = e.type
  const _message: MyEvents['chat'] = e.message
})

// @ts-expect-error - typed external rejects invalid sends too
typedExternal.send('hello')

// @ts-expect-error - typed external has no uid param
typedExternal.send({ type: 'chat', text: 'hi', user: 'John' }, 'uid')

// ─── STRICT TYPED EXTERNAL ──────────────────────────────────

const strictExternal = connect<StrictEvents>('wss://example.com')

strictExternal.send({ type: 'chat', text: 'hi', user: 'John' })

// @ts-expect-error - strict external rejects bad sends
strictExternal.send({ type: 'nonexistent' })

// @ts-expect-error - no uid on external
strictExternal.send({ type: 'chat', text: 'hi', user: 'John' }, 'uid')
