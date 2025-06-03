export type IttySocketEvent = 'open' | 'close' | 'message' | 'join' | 'leave'

type Date = { date: Date }
type UserDetails = { uid: string, alias?: string }
type OptionalUserDetails = { uid?: string, alias?: string }

export type MessageEvent<MessageType = any> = {
  message: MessageType
} & Date & UserDetails

export type JoinEvent = {
  type: 'join'
  users: number
} & Date & OptionalUserDetails

export type LeaveEvent = {
  type: 'leave'
  users: number
} & Date & OptionalUserDetails

export type ErrorEvent = {
  type: 'error'
  message: string
} & Date

export type SendMessage = <MessageFormat = any>(message: MessageFormat, recipient?: string) => IttySocket

export type IttySocket = {
  open: () => IttySocket,
  close: () => IttySocket,
  connected: boolean,
  send: SendMessage,
  push: SendMessage,
  on<MessageFormat = any>(type: 'message', listener: (event: MessageEvent<MessageFormat>) => any): IttySocket
  on(type: 'join', listener: (event: JoinEvent) => any): IttySocket
  on(type: 'leave', listener: (event: LeaveEvent) => any): IttySocket
  on(type: 'error', listener: (event: ErrorEvent) => any): IttySocket
  on(type: Exclude<IttySocketEvent, 'message'>, listener: () => any): IttySocket
  remove(type: IttySocketEvent, listener: () => any): IttySocket
}

type EventListeners = {
  open?: Array<() => any>
  close?: Array<() => any>
  message?: Array<(event: MessageEvent) => any>
  join?: Array<(event: JoinEvent) => any>
  leave?: Array<(event: LeaveEvent) => any>
}

export type IttySocketOptions = {
  as?: string,
  alias?: string,
  echo?: true,
  announce?: true,
}

export const connect = (channelId: string, options: IttySocketOptions = {}): IttySocket => {
  let ws: WebSocket | null,
    queue: string[] = [],
    closeAfterSend: number = 0,
    events: EventListeners = {}

  let open = () => {
    if (ws) return socket// Don't reconnect if already opening/open

    // @ts-ignore - options will be cast as string regardless of what is passed
    ws = new WebSocket(`wss://ittysockets.io/r/${channelId}?${new URLSearchParams(options)}`)

    ws.onopen = () => {
      while (queue.length) ws?.send(queue.shift()!)
      for (let listener of events.open ?? [])
        listener()
      // @ts-ignore
      if (closeAfterSend) ws?.close()
    }

    ws.onmessage = (
      event: any,
      parsed = JSON.parse(event.data),
    ) => {
      // @ts-ignore
      for (let listener of events[parsed.type ?? 'message'] ?? [])
        listener({ ...parsed, date: new Date(parsed.date) })
    }

    ws.onclose = () => {
      closeAfterSend = 0
      ws = null
      for (let listener of events.close ?? [])
        listener()
    }

    return socket
  }

  // @ts-ignore
  const socket = new Proxy(open, {
    get: (_, key: string) =>
      ({
        open,
        close: () => (ws?.readyState == 1 ? ws.close() : (closeAfterSend = 1), socket),
        send: (message: any, recipient?: string) => {
          message = JSON.stringify(message)
          message = recipient ? `@@${recipient}@@${message}` : message
          if (ws?.readyState == 1) return (ws.send(message), socket)
          queue.push(message)
          return open()
        },
        push: (message: any, recipient?: string) => (closeAfterSend = 1, socket.send(message, recipient)),
        on: (type: IttySocketEvent, listener: () => any) => {
          (events[type] ??= []).push(listener)
          return open()
        },
        remove: (
          type: IttySocketEvent,
          listener: () => any,
          listeners = events[type],
          i = listeners?.indexOf(listener) ?? -1
        ) => (
          ~i && listeners?.splice(i, 1),
          open()
        ),
      })[key]
  }) as IttySocket

  return socket
}

// GENERICS TESTING
// connect('test')
//   .on('message', (e) => console.log(e.message.name)) // OK
//   .on<{ age: number }>('message', (e) => console.log(e.message.name)) // error
//   .on('close', () => console.log('close')) // OK
//   .on<{ x: number }>('message', (e) => parseInt(e.message.x)) // error
//   .on<{ x: string }>('message', (e) => parseInt(e.message.x)) // OK
//   .send(123) // OK
//   .send<string>(123) // error
//   .on('join', e => console.log(e.users + 4)) // OK
//   .on('join', e => console.log(e.message)) // error
//   .on('leave', e => console.log(e.users - 4)) // OK
//   .on('error', e => console.log(e.message)) // OK
//   .on('error', e => console.log(e.foo)) // error
