<br />

<p>
<a href="https://itty.dev/itty-sockets" target="_blank">
  <img src="https://github.com/user-attachments/assets/cfe915d5-63ce-4297-83ef-316426c7af57" alt="itty-sockets" height="120" />
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

## Example
```ts
import { connect } from 'itty-sockets'

// create a channel instance
const foo = connect('foo')

// listen for messages
foo.listen(e => {
  console.log(e.alias ?? e.uid, 'says', e.message, 'at', e.date)
})

// send some messages
room
  .send('hello world!')
  .send([1,2,3]) // no need to stringify
  .send({ foo: 'bar' })

// or connect, send, and close - all in one call
room.push('this will send and close the connection')
```

## Features

- Simple and powerful API for sending and receiving messages & data
- Streamlines async race conditions
- No backend service needed.  Ours is fast and stores/logs nothing at all
- Ultra-tiny. It's an itty library, after all
- Full TypeScript support (when imported)

## What is itty-sockets?

`itty-sockets` is a tiny messaging client that simplifies data/message transmission between users/connections.
It's powered by [ittysockets.io](https://ittysockets.io), a free, fast, and private public service.  The idea is simple:

1. Connect to a channel using a unique name (you choose it)
2. Send messages to the channel (from one or more parties)
3. Listen for messages in the channel (from one or more parties)
4. Profit.

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
let connect=(e,s={})=>{let t,n=[],o=[],a=0,r=()=>{t||(t=new WebSocket(`wss://ittysockets.io/r/${e??""}?${new URLSearchParams(s)}`),t.onopen=()=>{for(;n.length;)t?.send(n.shift());a&&t?.close()},t.onmessage=(e,s=JSON.parse(e.data))=>{for(let e of o)e({...s,date:new Date(s.date)})},t.onclose=()=>(a=0,t=null))};return new Proxy(r,{get:(e,s,l)=>({ws:t,send:(e,s)=>(e=JSON.stringify(e),e=s?`@@${s}@@${e}`:e,1==t?.readyState?t.send(e)??l:(n.push(e),r()??l)),push:(e,s)=>(a=1,l.send(e,s)),listen:(e,s)=>(o.push((t=>(!s||s(t))&&e(t))),r()??l),close:()=>(1==t?.readyState?t.close():a=1,l)}[s])})};
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
| **send(message)** | Sends a message to the room | `room.send({ type: 'chat', text: 'hello' })` |
| **push(message)** | Sends a message and closes the connection | `room.push({ type: 'goodbye' })` |
| **listen(fn)** | Adds a message listener | `room.listen(msg => console.log(msg))` |
| **close()** | Closes the connection | `room.close()` |

### Available Options

| OPTION | DESCRIPTION | DEFAULT | EXAMPLE |
| --- | --- | --- | --- |
| **alias** | An optional display name for the connection | `undefined` | `{ alias: 'Kevin' }` |
| **echo** | Whether to echo messages back to the sender | `false` | `{ echo: true }` |


## Message Format
```ts
type Message = {
  id: string      // unique message ID
  date: Date      // JavaScript Date object
  message: any    // the message payload
}
```



