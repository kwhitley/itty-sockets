<br />

<p>
<a href="https://itty.dev/itty-socket" target="_blank">
  <img src="https://github.com/user-attachments/assets/cfe915d5-63ce-4297-83ef-316426c7af57" alt="itty-socket" height="120" />
</a>
</p>

[![Version](https://img.shields.io/npm/v/itty-socket.svg?style=flat-square)](https://npmjs.com/package/itty-socket)
[![Bundle Size](https://deno.bundlejs.com/?q=itty-socket&badge&badge-style=flat-square)](https://deno.bundlejs.com/?q=itty-socket)
[![Issues](https://img.shields.io/github/issues/kwhitley/itty-socket?style=flat-square)](https://github.com/kwhitley/itty-socket/issues)
[![Discord](https://img.shields.io/discord/832353585802903572?label=Discord&logo=Discord&style=flat-square&logoColor=fff)](https://discord.gg/53vyrZAu9u)

### [Documentation](https://itty.dev/itty-socket) &nbsp;| &nbsp; [Discord](https://discord.gg/53vyrZAu9u)

---

Tiny WebSocket client for the browser in under 500 bytes.

## Example
```ts
import { getRoom } from 'itty-socket'

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
window.getRoom=e=>{let t,s=[],n=[];const o=()=>{t||(t=new WebSocket("ws://localhost:3000/ws/"+e),t.onopen=()=>{for(;s.length;)t?.send(s.shift())},t.onmessage=e=>{try{let{date:t,...s}=JSON.parse(e.data);n.forEach((e=>e({date:new Date(t),...s})))}catch{}},t.onclose=()=>{t=null})};return new Proxy((()=>{}),{get:(e,a,l)=>"send"===a?e=>{const n=JSON.stringify(e);return 1==t?.readyState?t.send(n):(s.push(n),o()),l}:"push"===a?e=>l.send(e).close():"listen"===a?e=>(n.push(e),o(),l):"close"===a?()=>t&&3!=t.readyState?(t.readyState>0&&(t.close(),t=null),l):l:void 0})};
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
  date: string    // ISO date string
  message: any    // the message payload
}
```



