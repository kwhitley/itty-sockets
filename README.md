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

### [Documentation](https://ittysockets.io) &nbsp;| &nbsp; [Discord](https://discord.gg/53vyrZAu9u)

---

### Type-safe WebSocket routing in 512 bytes

## Features ✨
1. **Quality of Life Improvements (over native WebSocket)**
   - auto JSON handling
   - top-level payload access (`text` instead of `e.data.text`)
   - easy reconnections
   - message queuing eliminates race conditions
   - chainable API
1. **Powerful Routing**
   - all messages - `.on('message', data => console.log(data))`
   - custom types - `.on('chat', ({ text }) => console.log(text))`
   - custom filters - `.on(isOver20, ({ value }) => console.log(value))`
1. **Type-safety**
   - `.on<Chat>('chat', ({ text }) => console.log(text))`
   - `.send<Chat>({ type: 'chat', text: 'hello' })`
1. **Works with any JSON-based WebSocket server**
1. **Tiny footprint** - smaller than virtually any WebSocket boilerplate

## Basic Example
```ts
import { connect } from 'itty-sockets'

const ws = connect('wss://example.com')

ws
  .on('message', e => console.log(e.message))
  .send('hey!')
  .send({ foo: 'bar' })
```

## Optional use with `itty.ws` public server
`itty-sockets` has been designed to work with the public itty.ws service for even easier integrations.  With this path, it's possible to add realtime features without hosting a backend server at all.  We recommend using this for testing, prototyping, or simple projects. As your needs expand, simply replace itty.ws with your own server(s) - nothing in the client changes.

Using itty.ws channels provides a few features to the client (fully typed by passing the `UseItty` generic to `connect`):

1. `connect<UseItty>('my-channel')` - connect to a channel and go
1. adds `uid`, `alias`, and `date` to all messages
1. adds `join` and `leave` events to announce user changes
1. allows private messaging (by uid)

## Installation

**Option 1: Import**
```ts
import { connect } from 'itty-sockets'
```

**Option 2: Just copy this snippet:**
<!-- BEGIN SNIPPET -->
```ts
let connect=(e,s={})=>{let p,a=0,n=[],t=[],o={},l=()=>(p||(p=new WebSocket((/^wss?:/.test(e)?e:"wss://itty.ws/c/"+e)+"?"+new URLSearchParams(s)),p.onmessage=(e,s=JSON.parse(e.data),p=s?.message,a={...null==p?.[0]&&p,...s})=>{o[s?.type??p?.type]?.map((e=>e(a))),s?.type||o.message?.map((e=>e(a))),t.map((([e,s])=>e(a)&&s(a)))},p.onopen=()=>(n.splice(0).map((e=>p?.send(e))),o.open?.map((e=>e())),a&&p?.close()),p.onclose=()=>(a=0,p=null,o.close?.map((e=>e())))),m),m=new Proxy(l,{get:(e,s)=>({open:l,close:()=>(1==p?.readyState?p.close():a=1,m),push:(e,s)=>(a=1,m.send(e,s)),send:(e,s)=>(e=JSON.stringify(e),e=s?""+s+""+e:e,1==p?.readyState?(p.send(e),m):(n.push(e),l())),on:(e,s)=>(s&&(e?.[0]?(o[e]??=[]).push(s):t.push([e,s])),l()),remove:(e,s,p=o[e],a=p?.indexOf(s)??-1)=>(~a&&p?.splice(a,1),l())}[s])});return m};
```
<!-- END SNIPPET -->
Note: This will lose TypeScript support, but is great for adding to your browser console (via script extensions, etc).

## Next Steps

- [Getting Started](https://itty.dev/itty-sockets/getting-started) - Basic setup and first connections

