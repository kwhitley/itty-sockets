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

# WebSockets : simplified and minified.

Zero-config.  Pick a [public channel](https://ittysockets.io) and go.
```ts
// CLIENT 1 (listens for messages)
connect('unique-channel-name')
  // listen for all messages
  .on('message', e => console.log(e.message))

  // or just our custom messages
  .on('greeting',
    ({ user, text }) => console.log(user, 'says:', text)
  )
```

```ts
// CLIENT 2 (sends messages)
const channel = connect('unique-channel-name')
  .send({ foo: 'bar' })
  .send({ type: 'greeting', user: 'Halsey', text: 'Meow!' })


channel.send('what else can this do?')
```


## Or simply use `connect` as a tiny WebSocket client that brings the following:

- JSON parsing/stringifying
- message queing - sending automatically connects and queue is flushed on open
- easy reconnection (listeners keep working)
- custom listeners/filters
- chainable syntax (it's just handy)

```ts
const ws = connect('wss://somewhere.else')
             .on('message', console.log) // log all messages
             .send({ foo: 'bar' }) // send immediately, no waiting

// optional - reconnect every second (no effect if open)
setInterval(ws.open, 1000)
```

<br />

# Getting Started

### 1. Import the [tiny client](https://npmjs.com/package/itty-sockets).
```ts
import { connect } from 'itty-sockets'
```

...or simply paste this into your environment/console:
<!-- BEGIN SNIPPET -->
```ts
let connect=(e,s={})=>{let a,p=0,t=[],n=[],o={},l=()=>(a||(a=new WebSocket((/^wss?:/.test(e)?e:"wss://itty.ws/c/"+e)+"?"+new URLSearchParams(s)),a.onmessage=(e,s=JSON.parse(e.data),a=s?.message,p={...null==a?.[0]&&a,...s})=>{o[s?.type??a?.type]?.map((e=>e(p))),s?.type||o.message?.map((e=>e(p))),n.map((([e,s])=>e(p)&&s(p)))},a.onopen=()=>(t.splice(0).map((e=>a?.send(e))),o.open?.map((e=>e())),p&&a?.close()),a.onclose=()=>(p=0,a=null,o.close?.map((e=>e())))),m),m=new Proxy(l,{get:(e,s)=>({open:l,close:()=>(1==a?.readyState?a.close():p=1,m),push:(e,s)=>(p=1,m.send(e,s)),send:(e,s)=>(e=JSON.stringify(e),e=s?""+s+""+e:e,1==a?.readyState?(a.send(e),m):(t.push(e),l())),on:(e,s)=>(s&&(e?.[0]?(o[e]??=[]).push(s):n.push([e,s])),l())}[s])});return m};
```
<!-- END SNIPPET -->

<br />

### 2. Connect to a Channel (or external server)
To start, simply connect to a channel based on a unique name (this can be anything).

> **NOTE:** Pass a valid `ws://` or `wss://` URL as the channel identifier to bypass the public [ittysockets.io](https://ittysockets.io) service and use your own.

```ts
import { connect } from 'itty-sockets'

// basic connection
const channel = connect('my-super-secret-channel')

// with options
const channel = connect('my-super-secret-channel', {
                  alias: 'Kevin', // optional non-unique identifier, visible in messages
                  announce: true, // shares your uid/alias with the channel on joining
                  echo: true      // echos your own messages back to you (for testing)
                })

// or any external JSON WebSocket server
const channel = connect('wss://somewhere.else.entirely')
```

#### Connection Options

| option | default value | description |
| --- | --- | --- |
| `{ alias: 'any-string' }` | `undefined` | An optional display name to be included in your messages. |
| `{ as: 'any-string' }` | `undefined` | An optional display name to be included in your message (same as alias). |
| `{ announce: true }` | `false` | Shares your uid/alias when joining/leaving. |
| `{ echo: true }` | `false` | Echos messages back to original sender (good for testing). |

<br />

### 3. Use the channel.
With the channel connected, simply call methods on it.  Every method is chainable, returning the connection again (for more chaining).

| method | description | example |
| --- | --- | --- |
| **`.open()`** | Opens/re-opens the connection (manually, usually not needed). |
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
    console.log(`${alias ?? uid} says: ${message} @ ${date.toLocaleTimeString()}`)
  )
  .on('join', ({ users }) =>
    console.log(`A user has joined.  There are now ${users} in the channel.`)
  )
  .on('leave', ({ users }) =>
    console.log(`A user has left.  There are now ${users} in the channel.`)
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

<br />

# Privacy
[ittysockets.io](https://ittysockets.io) is a free, public-use, but _private_ service.

It was designed by me (a developer), to help myself and other developers achieve cool things.  As such:

1. Your messages are never transmitted to anything other than the sockets on the channel you're connected to.  No third-party service, no loggers, no storage (local or otherwise), not even a collection in memory. This protects your privacy/data, but keeps my costs to virtually zero, allowing me to share this service with the world... hopefully indefinitely.

2. I ask that you please use the channels responsibly.  We're all sharing this space!


