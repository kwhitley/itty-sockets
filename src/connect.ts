export type IttySocketEvent = 'open' | 'close' | 'message' | 'join' | 'leave'

type Date = { date: Date }
type UserDetails = { uid: string, alias?: string }
type OptionalUserDetails = { uid?: string, alias?: string }

export type IttyFormat<MessageType = any> = {
  message: MessageType
} & UserDetails & Date

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

export type SendMessage = <MessageFormat = any>(message: MessageFormat, recipient?: string) => IttySocket<GF>

export type IttySocket<GF = object> = {
  open: () => IttySocket<GF>,
  close: () => IttySocket<GF>,
  connected: boolean,
  send: SendMessage,
  push: SendMessage,
  remove(type: IttySocketEvent, listener: () => any): IttySocket<GF>

  // EVENTS
  on(type: 'open', listener: () => any): IttySocket<GF>
  on(type: 'close', listener: () => any): IttySocket<GF>
  on(type: 'join', listener: (event: JoinEvent) => any): IttySocket<GF>
  on(type: 'leave', listener: (event: LeaveEvent) => any): IttySocket<GF>
  on(type: 'error', listener: (event: ErrorEvent) => any): IttySocket<GF>
  on<MessageFormat = GF>(type: 'message', listener: (event: GF & MessageFormat) => any): IttySocket<GF>
  on<MessageFormat = GF>(type: string, listener: (event: GF & MessageFormat & { type: string }) => any): IttySocket<GF>
  on<MessageFormat = GF>(type: (event?: any) => any, listener: (event: GF & MessageFormat & { type: string }) => any): IttySocket<GF>
}

export type IttySocketOptions = {
  as?: string,
  alias?: string,
  echo?: true,
  announce?: true,
}

export let connect = <GF = object>(channelId: string, options: IttySocketOptions = {}): IttySocket<GF> => {
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
  }) as IttySocket<GF>

  return socket
}

// type Chat = { type: 'chat', user: string, text: string }

// connect('sad')
//   .on<Chat>('message', e => {
//     e.text
//   })
//   .on<Chat>('chat', (e) => {
//     e.text
//   })
//   .on<Chat>(v => v.type === 'chat', e => {
//     e.text
//   })

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

