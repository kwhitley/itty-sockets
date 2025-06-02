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

Tiny realtime messaging client in under 450 bytes.  No backend needed.

## Example (using [ittysockets.io](https://ittysockets.io) public channels)
```ts
import { connect } from 'itty-sockets' // ~422 bytes

// connect to a channel (optionally echo messages back to yourself)
const foo = connect('my-secret-room-name', { echo: true })

foo
  // we can listen for messages
  .on('message', e => console.log(e.message))

  // and/or send some
  .send('Hello World!')     // "Hello World!"
  .send([1, 2, 3])          // [1, 2, 3]
  .send({ foo: 'bar' })     // { foo: "bar" }
```

## Features

- Simple and powerful API for sending and receiving messages & data.
- No backend service needed.  Ours is fast and private.
- Full TypeScript support, including custom types for messages.
- Prevents WebSocket race conditions.  Automatically connects when needed to send/listen.
- Chainable. Every method returns the channel again.
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

For use in browser/DevTools scripting, copy and paste this snippet directly into your browser console, then use as normal:

<!-- BEGIN SNIPPET -->
```ts
let connect=(e,o={})=>{let s,t=[],n=0,a={},r=()=>(s||(s=new WebSocket(`wss://ittysockets.io/r/${e??""}?${new URLSearchParams(o)}`),s.onopen=()=>{for(;t.length;)s?.send(t.shift());for(let e of a.open??[])e();n&&s?.close()},s.onmessage=(e,o=JSON.parse(e.data))=>{for(let e of a[o.type??"message"]??[])e({...o,date:new Date(o.date)})},s.onclose=()=>{n=0,s=null;for(let e of a.close??[])e()}),l);const l=new Proxy(r,{get:(e,o)=>({open:r,close:()=>(1==s?.readyState?s.close():n=1,l),send:(e,o)=>(e=JSON.stringify(e),e=o?`@@${o}@@${e}`:e,1==s?.readyState?s.send(e)??l:(t.push(e),r())),push:(e,o)=>(n=1,l.send(e,o)),on:(e,o)=>((a[e]??=[]).push(o),r()),off:(e,o,s=a[e],t=s?.indexOf(o)??-1)=>(~t&&s?.splice(t,1),r())}[o])});return l};
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
| **connect(id, options)** | Creates a new channel connection | `connect('foo')` |
| **.open()** | Opens/re-opens the connection (manually, usually not needed) | `channel.open()` |
| **.close()** | Closes the connection | `channel.close()` |
| **.send(message)** | Sends a message to the channel | `channel.send({ type: 'chat', text: 'hello' })` |
| **.push(message)** | Sends a message and closes the connection | `channel.push({ type: 'goodbye' })` |
| **.on(EventName: string, listener)** | Add an event listener. | `channel.on('close', () => console.log('channel closed'))` |
| **.off(EventName: string, listener)** | Remove an event listener. | `channel.off('open', myListenerFunction)` |

### Events
Each event can have multiple listeners registered on it
| EVENT | DESCRIPTION | PAYLOAD | EXAMPLE |
| --- | --- | --- | --- |
| **message** | Triggered when receiving a message event. | #messageevent-format | `channel.on<MessageType = any>('message', listener)` |

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



