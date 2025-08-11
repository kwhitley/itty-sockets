<br />

<p>
<a href="https://itty.dev/itty-sockets" target="_blank">
  <img src="https://github.com/user-attachments/assets/651753c6-6a99-479b-8d5a-ac2aadc16e72" alt="itty-sockets" height="120" />
</a>
</p>

[![GitHub](https://img.shields.io/badge/GitHub-%23555.svg?style=flat-square&logo=github&logoColor=#fff)](https://github.com/kwhitley/itty-sockets)
[![Version](https://img.shields.io/npm/v/itty-sockets.svg?style=flat-square)](https://npmjs.com/package/itty-sockets)
[![Bundle Size](https://deno.bundlejs.com/?q=itty-sockets&badge&badge-style=flat-square)](https://deno.bundlejs.com/?q=itty-sockets)
[![Build Status](https://img.shields.io/github/actions/workflow/status/kwhitley/itty-sockets/verify.yml?branch=v0.x&style=flat-square)](https://github.com/kwhitley/itty-sockets/actions/workflows/verify.yml)
[![Coverage Status](https://img.shields.io/coveralls/github/kwhitley/itty-sockets?style=flat-square)](https://coveralls.io/github/kwhitley/itty-sockets)
[![Issues](https://img.shields.io/github/issues/kwhitley/itty-sockets?style=flat-square)](https://github.com/kwhitley/itty-sockets/issues)
[![Discord](https://img.shields.io/discord/832353585802903572?label=Discord&logo=Discord&style=flat-square&logoColor=fff)](https://discord.gg/53vyrZAu9u)

### [Documentation](https://itty.dev/itty-sockets) &nbsp;| &nbsp; [Discord](https://discord.gg/53vyrZAu9u)

---

### The last WebSocket client you'll need : 512 bytes, all-in.

## Features ✨
1. **DX perks** - JSON-in/out, queued messages, easy-reconnect, chainable everything.
1. **Works with any JSON-based WebSocket server**
1. **Powerful Routing**
   - Listen for all messages
     ```ts
     .on('message', data => console.log(data))
     ```
   - Only specific types
     ```ts
     // matches any data with { type: 'chat' }
     .on('chat', ({ text }) => console.log(text))
     ```
   - or fully custom filters
     ```ts
     // matches only messages where data.value > 20
     .on(
       ({ value }) => value > 20), // filter function
       ({ value }) => console.log(value),
     )
     ```
1. **Type-safe message handling**
1. **Tiny footprint** - 512 bytes, all-in.
1. **Optional usage with free/public/zero-config [itty.ws](https://itty.ws) service**

## Basic Example
```ts
import { connect } from 'itty-sockets'

// connect to the channel
const channel = connect('wss://example.com')

channel
  // log all messages
  .on('message', e => console.log(e.message))

  // send some messages
  .send('hey!')
  .send({ foo: 'bar' })
```

## Optional use with `itty.ws` public, privacy-first server
`itty-sockets` has been designed to work with the public [itty.ws](https://itty.ws) service for even easier integrations.  With this path, it's possible to add realtime features without hosting a backend server at all.  We recommend using this for testing, prototyping, or simple projects. As your needs expand, you can always replace [itty.ws](https://itty.ws) with your own server(s) - nothing in the client changes.

Using [itty.ws](https://itty.ws) channels provides a few features to the client (fully typed by passing the `UseItty` generic to `connect`):

1. `connect<UseItty>('my-channel')` - connect to a channel and go
1. adds `uid`, `alias`, and `date` to all messages
1. adds `join` and `leave` events to announce user changes
1. allows private messaging (by uid)

## Installation

**Option 1: Import**
```bash
npm install itty-sockets
```

```ts
import { connect } from 'itty-sockets'
```

**Option 2: Just copy this snippet:**
<!-- BEGIN SNIPPET -->
```ts
let connect=(e,s={})=>{let p,a=0,n=[],t=[],o={},l=()=>(p||(p=new WebSocket((/^wss?:/.test(e)?e:"wss://itty.ws/c/"+e)+"?"+new URLSearchParams(s)),p.onmessage=(e,s=JSON.parse(e.data),p=s?.message,a={...null==p?.[0]&&p,...s})=>{o[s?.type??p?.type]?.map(e=>e(a)),s?.type||o.message?.map(e=>e(a)),t.map(([e,s])=>e(a)&&s(a))},p.onopen=()=>(n.splice(0).map(e=>p?.send(e)),o.open?.map(e=>e()),a&&p?.close()),p.onclose=()=>(a=0,p=null,o.close?.map(e=>e()))),m),m=new Proxy(l,{get:(e,s)=>({open:l,close:()=>(1==p?.readyState?p.close():a=1,m),push:(e,s)=>(a=1,m.send(e,s)),send:(e,s)=>(e=JSON.stringify(e),e=s?""+s+""+e:e,1==p?.readyState?(p.send(e),m):(n.push(e),l())),on:(e,s)=>(s&&(e?.[0]?(o[e]??=[]).push(s):t.push([e,s])),l()),remove:(e,s,p=o[e],a=p?.indexOf(s)??-1)=>(~a&&p?.splice(a,1),l())}[s])});return m};
```
<!-- END SNIPPET -->
*Note: This will lose TypeScript support.*

## Example 2 - Receiving basic messages
Assume the following simple client
```ts
import { connect } from 'itty-sockets'

connect('wss://example.com')

  // listen for every message
  .on('message', console.log)

  // and just { type: 'chat' }
  .on('chat', 
    ({ user, text }) => console.log(`${user} says: ${text}`)
  )
```

Now let's assume the following 2 messages are sent:
```json
{
  "type": "chat",
  "user": "Kevin",
  "text": "Hey!"
}
```

```json
{
  "date": 1754659171196,
  "items": [1, 2, 3],
}
```

This will output the following to the console:
```
{ type: "chat", user: "Kevin", text: "Hey!" }

{ date: 1754659171196, items: [1, 2, 3] }

"Kevin says: Hey!"
```

## Example 3 - Reconnection
Using `itty-sockets`, you can safely fire `.open()` on the connection at any time, even if already connected.  All listeners will continue to work perfectly once reconnected.

```ts
const channel = connect('wss://example.com')
                  .on('message', console.log)
                  .on('open', () => console.log('connected'))
                  .on('close', () => console.log('disconnected'))

// we'll just reconnect every second - this is safe!
setInterval(channel.open, 1000)
```

## See the [full documentation](https://itty.dev/itty-sockets) to continue your journey!

