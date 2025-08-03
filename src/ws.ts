export type WSEvent = 'open' | 'close' | 'message'

export type MessageEvent<MessageType = any> = MessageType

export type SendMessage = <MessageFormat = any>(message: MessageFormat, recipient?: string) => IttyWS

export type IttyWS = {
  open: () => IttyWS,
  close: () => IttyWS,
  send: SendMessage,
  push: SendMessage,

  on(type: 'open', listener: () => any): IttyWS
  on(type: 'close', listener: () => any): IttyWS
  // Specific overloads without generics come first
  on<MessageFormat = any>(type: 'message', listener: (event: MessageEvent<MessageFormat>) => any): IttyWS
  on<MessageFormat = any>(type: string, listener: (event: MessageEvent<MessageFormat & { type: string }>) => any): IttyWS
  on<MessageFormat = any>(type: (event?: any) => any, listener: (event: MessageEvent<MessageFormat & { type: string }>) => any): IttyWS

  remove(type: WSEvent, listener: () => any): IttyWS
}

export let ws = (url: string, query: Record<string, string> = {}): IttyWS => {
  let ws: WebSocket | null,
      closeAfterSend = 0,
      queue: string[] = [],
      filters: Array<[(event?: any) => any, (event?: any) => any]> = [],
      events: Record<string, Array<(event?: any) => any>> = {}

  let open = () => {
    if (ws) return socket

    // @ts-ignore - options will be cast as string regardless of what is passed
    ws = new WebSocket(url + (query ? '?' + new URLSearchParams(query) : ''))

    ws.onmessage = (
      event: any,
      parsed = JSON.parse(event.data),
    ) => {
      events[parsed?.type]?.map(listener => listener(parsed)) // all custom messages
      if (!parsed?.type) events.message?.map(listener => listener(parsed)) // all user messages
      filters.map(([filter, listener]) => filter(parsed) && listener(parsed)) // all filtered messages
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
        push: (message: any) => (closeAfterSend = 1, socket.send(message)),
        send: (message: any) => (
          message = JSON.stringify(message),
          ws?.readyState == 1 ? (ws.send(message), socket) : (queue.push(message), open())
        ),
        on: (type: WSEvent | ((event?: any) => any), listener: () => any) => (
          // @ts-ignore
          listener && (type?.[0] ? (events[type] ??= []).push(listener) : filters.push([type, listener])),
          open()
        ),
        remove: (
          type: WSEvent,
          listener: () => any,
          listeners = events[type],
          i = listeners?.indexOf(listener) ?? -1
        ) => (~i && listeners?.splice(i, 1), open()),
      })[key]
  }) as IttyWS

  return socket
}

ws('location')
  .on('open', () => console.log('open'))
  .on<{ foo: 'bar' }>('chat', e => console.log(e.foo))

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

