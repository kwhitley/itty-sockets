type IttySocketEvent<BaseFormat> = BaseFormat extends UseItty
  ? 'open' | 'close' | 'message' | 'join' | 'leave'
  : 'open' | 'close' | 'message'

type Date = { date: Date }
type UserDetails = { uid: string, alias?: string }
type OptionalUserDetails = { uid?: string, alias?: string }

export type UseItty<MessageType = any> = {
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

export type IttySocketOptions = {
  as?: string,
  alias?: string,
  echo?: true,
  announce?: true,
}

export interface IttySocketConnect {
  <BaseFormat = object>(
    ...args: BaseFormat extends UseItty
      ? [channelID: string, options?: IttySocketOptions]
      : [url: string, queryParams?: any]
  ): IttySocket<BaseFormat>
}

type UseIttyEvents<BaseFormat> = {
  on(type: 'join', listener: (event: JoinEvent) => any): IttySocket<BaseFormat>
  on(type: 'leave', listener: (event: LeaveEvent) => any): IttySocket<BaseFormat>
  on(type: 'error', listener: (event: ErrorEvent) => any): IttySocket<BaseFormat>
}

type SendMessage<BaseFormat> = BaseFormat extends UseItty
  ? <MessageFormat = any>(message: MessageFormat, uid: string) => IttySocket<BaseFormat>
  : <MessageFormat = any>(message: MessageFormat) => IttySocket<BaseFormat>

export type IttySocket<BaseFormat = object> = {
  open: () => IttySocket<BaseFormat>
  close: () => IttySocket<BaseFormat>
  send: SendMessage<BaseFormat>
  push: SendMessage<BaseFormat>
  remove(type: IttySocketEvent<BaseFormat>, listener: () => any): IttySocket<BaseFormat>
  remove(type: string, listener: () => any): IttySocket<BaseFormat>

  // EVENTS
  on(type: 'open', listener: () => any): IttySocket<BaseFormat>
  on(type: 'close', listener: () => any): IttySocket<BaseFormat>
  on<MessageFormat = BaseFormat>(type: 'message', listener: (event: BaseFormat & MessageFormat) => any): IttySocket<BaseFormat>
  on<MessageFormat = BaseFormat>(type: string, listener: (event: BaseFormat & MessageFormat & { type: string }) => any): IttySocket<BaseFormat>
  on<MessageFormat = BaseFormat>(type: (event?: any) => any, listener: (event: BaseFormat & MessageFormat & { type: string }) => any): IttySocket<BaseFormat>
} & (BaseFormat extends UseItty ? UseIttyEvents<BaseFormat> : object)

export let connect: IttySocketConnect = (channelId: string, options = {}) => {
  let ws: WebSocket | null,
      closeAfterSend = 0,
      queue: string[] = [],
      filters: Array<[(event?: any) => any, (event?: any) => any]> = [],
      events: Record<string, Array<(event?: any) => any>> = {}

  let open = () => {
    if (ws) return socket

    // @ts-ignore - options will be cast as string regardless of what is passed
    ws = new WebSocket((/^wss?:/.test(channelId) ? channelId : 'wss://itty.ws/c/' + channelId) + '?' + new URLSearchParams(options))

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

  let socket: any = new Proxy(open, {
    get: (_, key: string) =>
      ({
        open,
        close: () => (ws?.readyState == 1 ? ws.close() : closeAfterSend = 1, socket),
        push: (message: any, recipient?: string) => (closeAfterSend = 1, socket.send(message, recipient!)),
        send: (message: any, recipient?: string) => (
          message = JSON.stringify(message),
          message = recipient ? '\x1F' + recipient + '\x1F' + message : message,
          ws?.readyState == 1 ? (ws.send(message), socket) : (queue.push(message), open())
        ),
        on: (type: any | ((event?: any) => any), listener: () => any) => (
          listener && (type?.[0] ? (events[type] ??= []).push(listener) : filters.push([type, listener])),
          open()
        ),
        remove: (
          type: any,
          listener: () => any,
          listeners = events[type],
          i = listeners?.indexOf(listener) ?? -1
        ) => (~i && listeners?.splice(i, 1), open()),
      })[key]
  })

  return socket
}

// type Chat = { type: 'chat', user: string, text: string }

// connect<UseItty>('doo')
//   .on<Chat>('message', e => {
//     e
//   })
//   .on<Chat>('chat', (e) => {
//     e.text
//   })
//   .on<Chat>(v => v.type === 'chat', e => {
//     e.texts
//   })
//   // .send() // test for (message) vs (message, recipient) based on BaseFormat type
//   .remove('leave',


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

