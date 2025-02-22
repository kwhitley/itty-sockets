// type Message = {
//   date: Date
//   uid?: string
//   alias?: string
//   message: any
// }

// type Listener = (message: Message) => any

// type SendMessage = (message: any, recipient?: string) => Connection

// type Connection = {
//   ws?: WebSocket,
//   send: SendMessage,
//   push: SendMessage,
//   listen: (listener: Listener) => Connection,
//   close: () => Connection,
// }

// type AllowedProperty = 'ws' | 'send' | 'push' | 'listen' | 'close'

type Predicate = (msg: Message) => boolean | undefined | number
type MessageHandler = (msg: Message) => any

import type { Message, Listener, SendMessage, Connection, AllowedProperty } from './types'

export const connect = (id: string, options: Record<string, any> = {}): Connection => {
  let ws: WebSocket | null,
    queue: string[] = [],
    listeners: Listener[] = [],
    closeAfterSend = 0

  let connect = () => {
    if (ws) return // Don't reconnect if already opening/open

    ws = new WebSocket(`wss://ittysockets.io/r/${id??''}?${new URLSearchParams(options)}`)

    ws.onopen = () => {
      while (queue.length) ws?.send(queue.shift()!)
      if (closeAfterSend) ws?.close()
    }

    ws.onmessage = (
      event: MessageEvent,
      parsed = JSON.parse(event.data),
    ) => {
      for (let listener of listeners)
        listener({ ...parsed, date: new Date(parsed.date) })
    }

    ws.onclose = () => (closeAfterSend = 0, ws = null)
  }

  // @ts-ignore
  return new Proxy(connect, {
    get: (_, key: AllowedProperty, __) =>
      ({
        ws,
        send: (
          message: any,
          recipient?: string,
        ) => {
          message = JSON.stringify(message)
          message = recipient ? `@@${recipient}@@${message}` : message
          if (ws?.readyState == 1) return ws.send(message) ?? __
          queue.push(message)

          return connect() ?? __
        },
        push: (message: any, recipient?: string) => {
          closeAfterSend = 1
          return __.send(message, recipient)
        },
        listen: (listener: Listener, when?: Predicate) => {
          listeners.push((msg: Message) => (when && when(msg) || true) && listener(msg))
          return connect() ?? __
        },
        close: () => (ws?.readyState == 1 ? ws.close() : (closeAfterSend = 1), __)
      })[key]
  })
}