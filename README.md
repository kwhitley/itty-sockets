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

Tiny realtime messaging client in under 500 bytes.  **No backend needed.**

## What does this solve?

Itty Sockets simplifies sending/receiving realtime data between parties.  For example, sending commands from one application to be received by another... streaming status updates... or maybe even just pushing interaction events to a user's channel when you're on their page (and when they're connected, they can just be listening to their own channel for incoming notifications).

The idea is simple:

1. One or more parties connect to a channel (by name).
2. They send/receive messages (this can be anything) in the channel.
3. That's it!

# Example
```ts
import { connect } from 'itty-sockets'

// connect to a channel
const foo = connect('my-secret-room-name')

foo
  // we can listen for messages
  .on('message', e => console.log(e.message))

  // and/or send some
  .send('Hello World!')     // "Hello World!"
  .send([1, 2, 3])          // [1, 2, 3]
  .send({ foo: 'bar' })     // { foo: "bar" }
```

### Important Considerations

1. **There is no history/replay/storage.**  It's a live stream only.  This is [intentional](#privacy).
2. **We don't authenticate.**  [ittysockets.io](https://ittysockets.io) leverages security through obfuscation (a near-infinite number of channel names).  Choose a more unique channel for more privacy.  Need more?  Consider encrypting/decrypting your payloads before transmission (this is easy).
3. **There are no guarantees of delivery.**  While [ittysockets.io](https://ittysockets.io) is *extremely* stable, it's a free public service that is provided without any guarantees of delivery or uptime.  Manage risk accordingly.
4. **Privacy.**  [ittysockets.io](https://ittysockets.io) does not store (or even log) any messages or data, period. It's cheaper for us that way, and safer for you.

<br />

# Getting Started

### 1. Import the [tiny client](https://npmjs.com/package/itty-sockets).
```ts
import { connect } from 'itty-sockets'
```

...or simply paste this into your environment/console:
<!-- BEGIN SNIPPET -->
```ts
let connect=(e,o={})=>{let s,t=[],n=0,r={},a=()=>(s||(s=new WebSocket(`wss://ittysockets.io/r/${e}?${new URLSearchParams(o)}`),s.onopen=()=>{for(;t.length;)s?.send(t.shift());for(let e of r.open??[])e();n&&s?.close()},s.onmessage=(e,o=JSON.parse(e.data))=>{for(let e of r[o.type??"message"]??[])e({...o,date:new Date(o.date)})},s.onclose=()=>{n=0,s=null;for(let e of r.close??[])e()}),l);const l=new Proxy(a,{get:(e,o)=>({open:a,close:()=>(1==s?.readyState?s.close():n=1,l),send:(e,o)=>(e=JSON.stringify(e),e=o?`@@${o}@@${e}`:e,1==s?.readyState?(s.send(e),l):(t.push(e),a())),push:(e,o)=>(n=1,l.send(e,o)),on:(e,o)=>((r[e]??=[]).push(o),a()),remove:(e,o,s=r[e],t=s?.indexOf(o)??-1)=>(~t&&s?.splice(t,1),a())}[o])});return l};
```
<!-- END SNIPPET -->

<br />

### 2. Create a Channel
To start, simply connect to a channel based on a unique name (this can be anything).

```ts
import { connect } from 'itty-sockets'

// basic connection
const channel = connect('my-channels/my-super-secret-channel')

// with options
const channel = connect('my-channels/my-super-secret-channel', {
                  as: 'Kevin',
                  announce: true,
                  echo: true
                })
```

#### Connection Options

| option | description | default | example |
| --- | --- | --- | --- |
| **as** | An optional display name for the connection. | `undefined` | `{ as: 'Kevin' }` |
| **alias** | An optional display name for the connection. | `undefined` | `{ alias: 'Kevin' }` |
| **announce** | Shares your uid/alias when joining/leaving. | `false` | `{ announce: true }` |
| **echo** | Echos messages back to original sender (good for testing). | `false` | `{ echo: true }` |

<br />

### 3. Use the channel.
With the channel connected, simply call methods on it.  Every method is chainable, returning the connection again (for more chaining).

| method | description | example |
| --- | --- | --- |
| **`.open()`** | Opens/re-opens the connection (manually, usually not needed). | `channel.open()` |
| **`.close()`** | Closes the connection. | `channel.close()` |
| **`.send(message: any)`** | Sends a message to the channel.  This can be anything serializable with JSON.stringify. | `channel.send({ type: 'chat', text: 'hello' })` |
| **`.push(message: any)`** | Sends a message and immediately closes the connection. | `channel.push('Hello World!')` |
| **`.on(eventName: string, listener)`** | Add an event listener. | `channel.on('close', () => console.log('channel closed'))` |
| **`.remove(eventName: string, listener)`** | Remove an event listener. The 2nd argument must be the same listener function registered in the `on` method. | `channel.remove('open', myListenerFunction)` |

#### Example

```ts

// connect
const channel = connect('my-secret-channel')

// add event listeners or send messages

channel
  .on('message', ({ alias, uid, message, date }) =>
    `${alias ?? uid} says: ${message} @ ${date.toLocaleTimeString()}`
  )
  .on('join', ({ users }) =>
    `A user has joined.  There are now ${users} in the channel.`
  )
  .on('leave', ({ users }) =>
    `A user has left.  There are now ${users} in the channel.`
  )
  .send('Hello World!') // this will queue up and send the message once connected
```

<br />

# Events
Each event can have multiple listeners registered on it.  These are stable, even if the underlying WebSocket is broken/re-established.
| event name | description | payload | example |
| --- | --- | --- | --- |
| `message` | Triggered when receiving a message event. | [MessageEvent](#messageevent) | `channel.on<MessageType = any>('message', listener)` |
| `join` | Triggered when a user (including self) joins the channel. This alerts all users that someone has joined, and informs them of the total number of users in the channel. If the joining party connected with { announce: true }, their user details will be shared with the channel. | [JoinEvent](#joineevent) | `channel.on('join', e => console.log('There are now', e.users, 'users in the channel.')` |
| `leave` | Triggered when a user leaves the channel. This alerts all users that someone has left, and informs them of the total number of users in the channel. If the leaving party connected with { announce: true }, their user details will be shared with the channel. | [LeaveEvent](#leaveeevent) | `channel.on('leave', e => console.log('There are now', e.users, 'users in the channel.')` |
| `error` | Triggered when the server sends an error to the user. This is rare. | [ErrorEvent](#error) | `channel.on('error', e => console.error('IttySockets Error:', e.message)` |
| `open` | Triggered when the connection is established. | none | `channel.on('open', () => console.log('connected to channel.')` |
| `close` | Triggered when the connection is closed. | none | `channel.on('close', () => console.log('disconnected from channel.')` |


<br />

## EventTypes
All event types *other* than `message` are identified with a `type` attribute.  For the sake of smaller payloads, `type` is omitted on normal messages.

#### MessageEvent
```ts
type MessageEvent = {
  id: string      // unique message ID
  uid: string     // unique user ID
  alias: string?  // optional display name
  date: Date      // JavaScript Date object
  message: any    // the message payload
}
```

#### JoinEvent <a id="joinevent" />
```ts
type JoinEvent = {
  type: 'join'    // type of event
  uid?: string    // uid of joiner if { announce: true }
  alias: string?  // alias of joiner if { announce: true }
  date: Date      // date of event
  users: number   // new number of users in the channel
}
```

#### LeaveEvent
```ts
type LeaveEvent = {
  type: 'leave'   // type of event
  uid?: string    // uid of leaver if { announce: true }
  alias: string?  // alias of leaver if { announce: true }
  date: Date      // date of event
  users: number   // new number of users in the channel
}
```

#### ErrorEvent
```ts
type MessageEvent = {
  type: 'error'   // error event identifier
  date: Date      // JavaScript Date object
  message: any    // the message payload
}
```


