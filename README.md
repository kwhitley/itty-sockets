<br />

<p>
<a href="https://itty.dev/itty-sockets" target="_blank">
  <img src="https://github.com/user-attachments/assets/651753c6-6a99-479b-8d5a-ac2aadc16e72" alt="itty-sockets" height="120" />
</a>
</p>

[![Version](https://img.shields.io/npm/v/itty-sockets.svg?style=flat-square)](https://npmjs.com/package/itty-sockets)
[![Bundle Size](https://deno.bundlejs.com/?q=itty-sockets&badge&badge-style=flat-square)](https://deno.bundlejs.com/?q=itty-sockets)
[![Coverage Status](https://img.shields.io/coveralls/github/kwhitley/itty-sockets?style=flat-square)](https://coveralls.io/github/kwhitley/itty-sockets)
[![Issues](https://img.shields.io/github/issues/kwhitley/itty-sockets?style=flat-square)](https://github.com/kwhitley/itty-sockets/issues)
[![Discord](https://img.shields.io/discord/832353585802903572?label=Discord&logo=Discord&style=flat-square&logoColor=fff)](https://discord.gg/53vyrZAu9u)

### [Documentation](https://itty.dev/itty-sockets) &nbsp;| &nbsp; [Discord](https://discord.gg/53vyrZAu9u)

---

Tiny messaging client in under 400 bytes.  No backend needed.

## Example (using ittysockets.io public channels)
```ts
import { connect } from 'itty-sockets' // ~400 bytes

// create a channel instance
const foo = connect('foo', { echo: true }) // echo messages back to sender

// listen for messages
foo.listen(e => {
  console.log(e.alias ?? e.uid, 'says', e.message, 'at', e.date)
})

// send some messages
foo
  .send('hello world!')
  .send([1,2,3]) // no need to stringify
  .send({ foo: 'bar' })

// or connect, send, and close - all in one call
foo.push('this will open, send, and close the connection')
```

## Example (other WebSocket servers)
```ts
import { ws } from 'itty-sockets' // ~340 bytes

const foo = ws('wss://example.com', { json: true })

foo
  .listen(console.log) // this will auto-parse JSON messages from the server
  .send('hello world!')
  .send([1,2,3])
  .send({ foo: 'bar' })
```

## Features

- Simple and powerful API for sending and receiving messages & data.
- Prevents WebSocket race conditions.
- No backend service needed.  Ours is fast and private.
- Full TypeScript support, including custom types for messages.
- Ultra-tiny. It's an itty library, after all.

## What is itty-sockets?

`itty-sockets` is a tiny messaging client that simplifies data/message transmission between users/connections.
It's powered by [ittysockets.io](https://ittysockets.io), a free, fast, and private public service.  The idea is simple:

1. Connect to a channel by name (creates a new channel if it doesn't exist).
2. Send/receive messages in the channel.
3. That's it!

This is an easy way to transmit messages between clients, but comes with limitations and considerations:

1. **There is no history/replay.**  It's a live stream.
2. **We don't authenticate.**  Itty Sockets leverages security merely through obfuscation (a near-infinite number of channel names).  Use a secure channel name and/or encode your payloads if concerned about eavesdropping. Add your own authentication layer, if needed.
3. **There are no guarantees of delivery.**  Itty Sockets is not a traditional messaging system.  It's a public service that is provided without any guarantees of delivery, order, or persistence.  Use it for real-time communication, not for mission-critical data.

### Privacy Concerns
**We do not store any messages or data**
There is intentionally no message logging or tracking of any kind.  It's easier for us that way, and safer for you.

## Browser Usage

If you want to send/receive messages from the browser (e.g. for sending information from one web page or tab to another), copy and paste this snippet directly into your browser console, then use as normal.

<!-- BEGIN SNIPPET -->
```ts
let connect=(e,s={})=>{let o,t=[],n=[],a=0,r={},c=()=>(o||(o=new WebSocket(`wss://ittysockets.io/r/${e??""}?${new URLSearchParams(s)}`),o.onopen=()=>{for(;t.length;)o?.send(t.shift());r.open?.(),a&&o?.close()},o.onmessage=(e,s=JSON.parse(e.data))=>{for(let e of n)e({...s,date:new Date(s.date)})},o.onclose=()=>(a=0,o=null,r.close?.())),l);const l=new Proxy(c,{get:(e,s)=>({open:c,close:()=>(1==o?.readyState?o.close():a=1,l),send:(e,s)=>(e=JSON.stringify(e),e=s?`@@${s}@@${e}`:e,1==o?.readyState?o.send(e)??l:(t.push(e),c())),push:(e,s)=>(a=1,l.send(e,s)),on:(e,s)=>(r[e]=s,"message"==e?(n.push(s),c()):l)}[s])});return l};
```
<!-- END SNIPPET -->

afterwards:
```ts
// send a message on connect 'foo'
connect('foo').push('hello world!')
```

## API

| METHOD | DESCRIPTION | EXAMPLE |
| --- | --- | --- |
| **connect(id, options)** | Creates a new connect | `connect('foo')` |
| **send(message)** | Sends a message to the room | `channel.send({ type: 'chat', text: 'hello' })` |
| **push(message)** | Sends a message and closes the connection | `channel.push({ type: 'goodbye' })` |
| **.on('message', listener)** | Adds a message listener (multiple allowed) | `channel.on('message', event => console.log(event))` |
| **.on('open', listener)** | Executes a listener on channel open (one allowed) | `channel.on('open', () => console.log('channel opened'))` |
| **.on('close', listener)** | Executes a listener on channel close (one allowed) | `channel.on('close', () => console.log('channel closed'))` |
| **close()** | Closes the connection | `channel.close()` |

### Available Options

| OPTION | DESCRIPTION | DEFAULT | EXAMPLE |
| --- | --- | --- | --- |
| **alias** | An optional display name for the connection | `undefined` | `{ alias: 'Kevin' }` |
| **echo** | Whether to echo messages back to the sender | `false` | `{ echo: true }` |


## MessageEvent Format
```ts
type MessageEvent = {
  id: string      // unique message ID
  uid: string     // unique user ID
  alias: string?  // optional display name
  date: Date      // JavaScript Date object
  message: any    // the message payload
}
```



