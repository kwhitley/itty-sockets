export type Message = {
  date: Date
  uid?: string
  alias?: string
  message: any
}

export type Predicate = (msg: Message) => boolean

export type Listener = (message: Message) => any

export type SendMessage = (message: any, recipient?: string) => Connection

export type Connection = {
  ws?: WebSocket,
  send: SendMessage,
  push: SendMessage,
  listen: (listener: Listener, when?: Predicate) => Connection,
  close: () => Connection,
}

export type AllowedProperty = 'ws' | 'send' | 'push' | 'listen' | 'close'