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

### [Documentation](https://ittysockets.io) &nbsp;| &nbsp; [Discord](https://discord.gg/53vyrZAu9u)

---

WebSockets are powerful, but the native API has rough edges:
1. We always have to stringify/parse payloads (not a big deal)
1. We can't send until it's open (still not a huge deal...)
1. We lose all our listeners if we close/reconnect (oof. let's write a factory!)

## We currently do things like this (raw WebSocket)
```js
const ws = new WebSocket('ws://localhost:8080');
let reconnect // we'll need this later

ws.onopen = () => {
  // Can only send messages after connection opens
  ws.send(JSON.stringify({ hello: 'world' }));

  // let's clear any reconnect interval
  clearInterval(reconnect)
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data); // Manual parsing
  console.log('Received:', data);
};

ws.onclose = () => {

  // if it closes, we have to create a new WebSocket, and re-bind all the above events... including this one
  reconnect = setInterval(() => {
    ws = new WebSocket('ws://localhost:8080');

    // Now we have to rebind all the event handlers to the new WebSocket instance!
    // Time to build factory/class to handle that for us...
  }, 1000);
};
```

## itty-sockets lets us do this:
```js
// itty-sockets
import { connect } from 'itty-sockets' // ~500 bytes

const client = connect('ws://localhost:8080')
  .on('message', console.log) // already parsed
  .send({ hello: 'world!' }) // will stringify and send when connected

// to handle reconnects, we can spam reconnect attempts - these will be ignored if still open
// we also don't have to reconnect any listeners, they get automatically re-applied
setInterval(client.open, 1000)
```

## ...or if using [ittysockets.io](https://ittysockets.io):
```js
// share a channel from ittysockets.io instead of your own socket server
const channel = connect('my-secret-channel-name')
  .on('message', console.log)
  .send({ hello: 'world!' })
```

## What itty-sockets handles for you

- **Race conditions** - Works reliably in any connection state
- **JSON** - Messages are automatically stringified/parsed
- **Persistent event listeners** - Events survive reconnections


> QUESTION: Will it save the ~500 bytes it cost?
>
> ANSWER: In most cases, _**yes.**_  In our tests, a factory function to provide the basic safety around WebSockets, without any fluff/messaging, was around 800 bytes (minified+gzipped).


## Quick Start

```bash
npm install itty-sockets
```

### Connect to your WebSocket server

```js
import { connect } from 'itty-sockets'

const client = connect('ws://localhost:8080')
  .on('message', (event) => {
    // event.message contains your data (auto-parsed from JSON)
    console.log('Got:', event.message);
  })
  .on('open', () => console.log('Connected!'))
  .on('close', () => console.log('Disconnected'));

// Send data (auto-stringified to JSON)
client.send({ type: 'chat', text: 'Hello!' });
client.send([1, 2, 3]);
client.send('Simple string');
```

### Custom reconnection

```js
const client = connect('ws://localhost:8080')
  .on('close', () => {
    console.log('Lost connection, reconnecting in 1 second...');
    setTimeout(() => client.open(), 1000);
  });
```

### Works everywhere

```js
// Your own WebSocket server
connect('ws://localhost:8080')

// Secure WebSocket
connect('wss://api.example.com/ws')

// Or use the free ittysockets.io service for quick prototyping
connect('my-channel-name') // Connects to hosted service
```

## API Reference

| Method | Description | Example |
| --- | --- | --- |
| `connect(url)` | Create a connection to WebSocket server | `connect('ws://localhost:8080')` |
| `.send(data)` | Send data (auto-serialized to JSON) | `client.send({ hello: 'world' })` |
| `.on(event, handler)` | Add event listener | `client.on('message', console.log)` |
| `.open()` | Open/reopen connection | `client.open()` |
| `.close()` | Close connection | `client.close()` |

### Events

| Event | When | Payload |
| --- | --- | --- |
| `message` | Message received | `{ message: any, id: string, date: Date }` |
| `open` | Connection opened | none |
| `close` | Connection closed | none |
| `error` | Connection error | `{ message: string }` |

## Why not raw WebSocket?

| Challenge | Raw WebSocket | itty-sockets |
| --- | --- | --- |
| Send before connected | ❌ Throws error | ✅ Queues automatically |
| Reconnection | ❌ Manual rebinding | ✅ Events persist |
| JSON handling | ❌ Manual stringify/parse | ✅ Automatic |
| Message queuing | ❌ Build yourself | ✅ Built-in |
| Race conditions | ❌ Check readyState | ✅ Handled for you |

---

**Need a backend?** The [ittysockets.io](https://ittysockets.io) service provides free WebSocket hosting for prototyping, but itty-sockets works with any WebSocket server.