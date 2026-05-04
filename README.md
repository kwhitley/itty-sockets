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

### [Full Documentation](https://ittysockets.com/docs) &nbsp;| &nbsp; [Discord](https://discord.gg/53vyrZAu9u)

---

# Zero-Config WebSockets.

No accounts, no API keys, nothing to deploy. Just connect and start sending.


## Chat Example
```ts
import { connect } from 'itty-sockets' // ~466 bytes

// Alice joins a room and listens
connect('chat-room', { as: 'Alice' })
  .on('message', ({ alias, text, mood }) =>
    console.log(`${alias} (${mood}): ${text}`)
  )
```

meanwhile, elsewhere...

```ts
// Bob joins the same room and sends a message
const bob = connect('chat-room', { as: 'Bob' })

bob.send({
  text: 'hey Alice!',
  mood: 'excited',
})

// Alice's console: → "Bob (excited): hey Alice!"
```

<br />

## Comparison
| | Pusher / Ably | Socket.IO | itty-sockets |
| --- | --- | --- | --- |
| Time to first message| sign up → key → SDK → connect | deploy server → SDK → connect | **`connect('foo').send(...)`** |
| Account / API key | required | N/A (self-host) | **none** | 
| Server to run | **none (hosted)** | yes | **none (hosted)** |
| Free tier | limited | N/A | **[it's _all_ free](https://ittysockets.com/pricing)** | 
| Client size | ~30–50kB | ~40kB | **466B** | 
| Logging / data retention | yes | up to you | none |

<br />

## Installation

```bash
npm install itty-sockets
```

Or just paste the following snippet (loses TypeScript support):
<!-- BEGIN SNIPPET -->
```ts
let connect=(e,s={})=>{let a,t,n=[],p={},o=()=>(a||(a=new WebSocket((/^wss?:/.test(e)?e:"wss://itty.ws/c/"+e)+"?"+new URLSearchParams(s)),a.onmessage=(e,s=JSON.parse(e.data),a=s?.message,t={...null==a?.[0]&&a,...s})=>[t.type,s.type?0:"message","*"].map(e=>p[e]?.map(e=>e(t))),a.onopen=()=>(n.splice(0).map(e=>a.send(e)),p.open?.map(e=>e(t)),t&&a?.close()),a.onclose=()=>(t=a=null,p.close?.map(e=>e(t)))),l),l={open:o,send:(e,s)=>(e=(s?`${s}`:"")+JSON.stringify(e),1&a?.readyState?a.send(e):n.push(e),o()),on:(e,s)=>((p[e?.[0]?e:"*"]??=[]).push(e?.[0]?s:a=>e?.(a)&&s(a)),o()),remove:(e,s)=>(p[e]=p[e]?.filter(e=>e!=s),l),close:()=>(1&a?.readyState?a.close():t=1,l),push:(e,s)=>(t=1,l.send(e,s))};return l};
```
<!-- END SNIPPET -->

<br />

## API at a Glance

| Method | Description |
|---|---|
| `connect(channel, options?)` | Connect to a channel (or raw `wss://` URL) |
| `.on(type, listener)` | Listen for events (`'message'`, `'join'`, `'leave'`, `'open'`, `'close'`, `'error'`, custom types, or `'*'`) |
| `.on(filterFn, listener)` | Listen with a custom filter function |
| `.send(message, uid?)` | Send a message (optionally to a specific user) |
| `.push(message, uid?)` | Send a message and disconnect afterwards |
| `.open()` | (Re)connect — safe to call anytime, listeners are preserved |
| `.close()` | Disconnect |
| `.remove(type, listener)` | Remove a listener |

<br />

## See the [full documentation](https://ittysockets.com/docs).
