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

### [Full Documentation](https://itty.ws/docs) &nbsp;| &nbsp; [Discord](https://discord.gg/53vyrZAu9u)

---

## Zero-Config WebSockets.

No accounts, no API keys, nothing to deploy. Just connect and start sending.

**~466 bytes** min+gzip &bull; **$0/month** &bull; **Free forever**

## Features
- **Zero Configuration** - No accounts, no API keys, no server. Pick a channel name and you're live.
- **Zero Cost** - No tiers. No credit card. Built for the community.
- **Private by Default** - No logging, no tracking, no storage. Messages are relayed and forgotten.
- **Send Anything** - Strings, objects, arrays — anything JSON-serializable.
- **Tiny Client** - ~466 bytes gzipped with JSON-in/out, message queuing, reconnect, type-safe routing, and a fully chainable API.
- **Access Control** - Reserve a namespace to control who can join or send on your channels — no backend required.

## Quick Start
```ts
import { connect } from 'itty-sockets' // ~466 bytes

connect('my-channel')
  .on('message', ({ message }) => console.log(message))
  .send('hello world')   // strings
  .send([1, 2, 3])       // arrays
  .send({ foo: 'bar' })  // objects
```

## Chat Example
```ts
import { connect } from 'itty-sockets'

// two users, same channel
const alice = connect('chat-room', { as: 'Alice' })
const bob   = connect('chat-room', { as: 'Bob' })

alice.on('message', ({ message, alias }) =>
  console.log(`${alias}: ${message}`)
)

bob.send('hey Alice!')
// → "Bob: hey Alice!"
```

## Access Control
Reserve a namespace to protect your channels with join and send keys — all managed from your [dashboard](https://itty.ws/reservations).
```ts
import { connect } from 'itty-sockets'

// namespace-protected channel
connect('myapp:notifications', {
  joinKey: 'your-join-key',
  sendKey: 'your-send-key',
})
```

## Installation

```bash
npm install itty-sockets
```

```ts
import { connect } from 'itty-sockets'
```

## API at a Glance

| Method | Description |
|---|---|
| `connect(channel, options?)` | Connect to a channel (or raw `wss://` URL) |
| `.on(type, listener)` | Listen for events (`'message'`, `'join'`, `'leave'`, `'open'`, `'close'`, `'error'`, custom types, or `'*'`) |
| `.on(filterFn, listener)` | Listen with a custom filter function |
| `.send(message, uid?)` | Send a message (optionally to a specific user) |
| `.push(message, uid?)` | Send a message and disconnect |
| `.open()` | (Re)connect — safe to call anytime, listeners are preserved |
| `.close()` | Disconnect |
| `.remove(type, listener)` | Remove a listener |

## See the [full documentation](https://itty.ws/docs) for more!
