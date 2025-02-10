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
window.connect=(e,s)=>{let t,n=[],o=[],a=0,l=()=>{t||(t=new WebSocket(`ws://localhost:3000/r/${e??""}${s?`?${new URLSearchParams(s)}`:""}`),t.onopen=()=>{for(;n.length;)t?.send(n.shift());a&&t?.close()},t.onmessage=(e,s=JSON.parse(e.data))=>{for(let e of o)e({...s,date:new Date(s.date)})},t.onclose=()=>(a=0,t=null))};return new Proxy(l,{get:(e,s,r)=>({ws:t,send:(e,s)=>(e=JSON.stringify(e),e=s?`@@${s}@@${e}`:e,1==t?.readyState?t.send(e)??r:(n.push(e),l(),r)),push:(e,s)=>r.send(e,s).close(),listen:e=>(o.push(e),l(),r),close:()=>(1==t?.readyState?t.close():a=1,r)}[s])})};
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



