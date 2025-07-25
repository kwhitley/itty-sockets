export type IttySocketEvent = 'open' | 'close' | 'message' | 'join' | 'leave'

type Date = { date: Date }
type UserDetails = { uid: string, alias?: string }
type OptionalUserDetails = { uid?: string, alias?: string }

export type MessageEvent<MessageType = any> = {
  message: MessageType
} & Date & UserDetails & MessageType

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

  // Specific overloads without generics come first
  on(type: 'join', listener: (event: JoinEvent) => any): IttySocket
  on(type: 'leave', listener: (event: LeaveEvent) => any): IttySocket
  on(type: 'error', listener: (event: ErrorEvent) => any): IttySocket
  on<MessageFormat = any>(type: 'message', listener: (event: MessageEvent<MessageFormat>) => any): IttySocket
  on<MessageFormat = any>(type: string, listener: (event: MessageEvent<MessageFormat & { type: string }>) => any): IttySocket
  on<MessageFormat = any>(type: (event?: any) => any, listener: (event: MessageEvent<MessageFormat & { type: string }>) => any): IttySocket

  remove(type: IttySocketEvent, listener: () => any): IttySocket
}

export type IttySocketOptions = {
  as?: string,
  alias?: string,
  echo?: true,
  announce?: true,
}

export let connect = (channelId: string, options: IttySocketOptions = {}): IttySocket => {
  let ws: WebSocket | null,
      closeAfterSend = 0,
      queue: string[] = [],
      filters: Array<[(event?: any) => any, (event?: any) => any]> = [],
      events: Record<string, Array<(event?: any) => any>> = {}

  let open = () => {
    if (ws) return socket

    // @ts-ignore - options will be cast as string regardless of what is passed
    ws = new WebSocket((/^wss?:/.test(channelId) ? channelId : 'wss://ittysockets.io/c/' + channelId) + '?' + new URLSearchParams(options))

    ws.onmessage = (
      event: any,
      parsed = JSON.parse(event.data),
      payload = parsed?.message,
      eventPayload = {
        ...(payload?.[0] == null && payload),
        ...parsed,
        ...(parsed.date && { date: new Date(parsed.date) })
      },
    ) => {
      events[parsed?.type ?? payload?.type]?.map(listener => listener(eventPayload)) // all custom messages
      if (!parsed?.type) events.message?.map(listener => listener(eventPayload)) // all user messages
      filters.map(([filter, listener]) => filter(eventPayload) && listener(eventPayload)) // all filtered messages
    }

    ws.onopen = () => (
      queue.splice(0).map(m => ws?.send(m)),
      events.open?.map(listener => listener()),
      closeAfterSend && ws?.close()
    )

    ws.onclose = () => (
      closeAfterSend = 0,
      ws = null,
      events.close?.map(listener => listener())
    )

    return socket
  }

  // @ts-ignore - dark itty magic
  let socket = new Proxy(open, {
    get: (_, key: string) =>
      ({
        open,
        close: () => (ws?.readyState == 1 ? ws.close() : closeAfterSend = 1, socket),
        push: (message: any, recipient?: string) => (closeAfterSend = 1, socket.send(message, recipient)),
        send: (message: any, recipient?: string) => (
          message = JSON.stringify(message),
          message = recipient ? '@@' + recipient + '@@' + message : message,
          ws?.readyState == 1 ? (ws.send(message), socket) : (queue.push(message), open())
        ),
        on: (type: IttySocketEvent | ((event?: any) => any), listener: () => any) => (
          // @ts-ignore
          listener && (type?.[0] ? (events[type] ??= []).push(listener) : filters.push([type, listener])),
          open()
        ),
        remove: (
          type: IttySocketEvent,
          listener: () => any,
          listeners = events[type],
          i = listeners?.indexOf(listener) ?? -1
        ) => (~i && listeners?.splice(i, 1), open()),
      })[key]
  }) as IttySocket

  return socket
}

// GENERICS TESTING
// connect('test')
//   .on('message', (e) => e.message.name)
//   .on('close', () => {})
//   .send(123)
//   .on<{ x: string }>('message', (e) => parseInt(e.message.x))
//   .send<{ foo: string }>({ foo: 'bar' })
//   .on('join', e => e.users + 4)
//   .on('leave', e => e.users - 4)
//   .on('error', e => e.message)
//   .on('message', e => e.message.whatever)
//   .on('message', e => e.whatever)
//   .on<{ foo: string }>('message', e => e.message.foo)
//   .on<{ foo: string }>('message', e => e.foo)
//   .on<{ foo: string }>('chat', e => e.foo)
//   .on<{ foo: string }>('chat', e => e.type)
//   .send({ $type: 'chat', foo: 'bar' })
//   .on('*', e => e.message)

//   .on<{ age: number }>('message', (e) => e.message.name) // ERROR
//   .on<{ x: number }>('message', (e) => parseInt(e.message.x)) // ERROR
//   .send<string>(123) // ERROR
//   .send<{ foo: string }>(123) // ERROR
//   .send<{ foo: string }>({ foo: 'foo', bar: 123 }) // ERROR
//   .on('join', e => e.message) // ERROR
//   .on<{ foo: string }>('join', e => e.users) // ERROR
//   .on('leave', e => e.message) // ERROR
//   .on('error', e => e.foo) // ERROR
//   .on<{ foo: string }>('message', e => e.message.whatever) // ERROR
//   .on<{ foo: string }>('chat', e => e.bar) // ERROR

