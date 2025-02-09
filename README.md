<br />

<p>
<a href="https://itty.dev/itty-sockets" target="_blank">
  <img src="https://github.com/user-attachments/assets/cfe915d5-63ce-4297-83ef-316426c7af57" alt="itty-sockets" height="120" />
</a>
</p>

[![Version](https://img.shields.io/npm/v/itty-sockets.svg?style=flat-square)](https://npmjs.com/package/itty-sockets)
[![Bundle Size](https://deno.bundlejs.com/?q=itty-sockets&badge&badge-style=flat-square)](https://deno.bundlejs.com/?q=itty-sockets)
[![Issues](https://img.shields.io/github/issues/kwhitley/itty-sockets?style=flat-square)](https://github.com/kwhitley/itty-sockets/issues)
[![Discord](https://img.shields.io/discord/832353585802903572?label=Discord&logo=Discord&style=flat-square&logoColor=fff)](https://discord.gg/53vyrZAu9u)

### [Documentation](https://itty.dev/itty-sockets) &nbsp;| &nbsp; [Discord](https://discord.gg/53vyrZAu9u)

---

Tiny WebSocket client for the browser in under 500 bytes.

## Example
```ts
import { getRoom } from 'itty-sockets'

// create a room instance
const room = getRoom('my-room-id')

// listen for messages
room.listen(message => {
  console.log('received:', message)
})

// send a message
room.send({ type: 'chat', text: 'hello!' })

// or send and close
room.push({ type: 'goodbye' })
```

## Features

- Tiny. It's an itty library, after all.
- Auto-reconnection
- Message queueing when disconnected
- Simple and powerful API
- Full TypeScript support

## Browser Usage

Copy and paste this snippet directly into your browser console:

<!-- BEGIN SNIPPET -->
```ts
window.connect=(e,t)=>{let s,n=[],o=[],r=0;return new Proxy((()=>{}),{get:(a,c,l)=>{const d=()=>{if(s)return l;s=new WebSocket("wss://ittysockets.io/r/"+(e??"")+(t?`?${new URLSearchParams(t).toString()}`:"")),s.onopen=()=>{for(;n.length;)s?.send(n.shift());r&&s?.close()},s.onmessage=e=>{try{let t=JSON.parse(e.data);for(let e of o)e({date:new Date(t.date),...t})}catch{}},s.onclose=()=>{r=0,s=null}};return"ws"==c?s:"send"==c?e=>{const t=JSON.stringify(e);return 1==s?.readyState?s.send(t)??l:(n.push(t),d()??l)}:"push"==c?e=>(r=1,l.send(e)):"listen"===c?e=>(o.push(e),d()??l):"close"==c?()=>(1==s?.readyState?s.close():r=1,l):void 0}})};
```
<!-- END SNIPPET -->

## API

| METHOD | DESCRIPTION | EXAMPLE |
| --- | --- | --- |
| **send(message)** | Sends a message to the room | `room.send({ type: 'chat', text: 'hello' })` |
| **push(message)** | Sends a message and closes the connection | `room.push({ type: 'goodbye' })` |
| **listen(fn)** | Adds a message listener | `room.listen(msg => console.log(msg))` |
| **close()** | Closes the connection | `room.close()` |

## Message Format
```ts
type Message = {
  id: string      // unique message ID
  date: Date      // JavaScript Date object
  message: any    // the message payload
}
```



