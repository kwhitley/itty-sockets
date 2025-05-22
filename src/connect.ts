export type AllowedProperty = 'open' | 'close' | 'send' | 'push' | 'on' | 'off' // | 'connected'

export type IttySocketEvent = 'open' | 'close' | 'message'

export type MessageEvent<MessageType = any> = {
  date: Date
  uid?: string
  alias?: string
  message: MessageType
}

export type SendMessage = <MessageFormat = any>(message: MessageFormat, recipient?: string) => IttySocket

export type IttySocket = {
  open: () => IttySocket,
  close: () => IttySocket,
  connected: boolean,
  send: SendMessage,
  push: SendMessage,
  on<MessageFormat = any>(type: 'message', listener: (event: MessageEvent<MessageFormat>) => any): IttySocket
  on(type: Exclude<IttySocketEvent, 'message'>, listener: () => any): IttySocket
}

type EventListeners = {
  message?: Array<(event: MessageEvent) => any>
  open?: Array<() => any>
  close?: Array<() => any>
}

export type IttySocketOptions = {
  as?: string,
  alias?: string,
  echo?: boolean,
}

export const connect = (id: string, options: IttySocketOptions = {}): IttySocket => {
  let ws: WebSocket | null,
    queue: string[] = [],
    closeAfterSend: number = 0,
    events: EventListeners = {}

  let open = () => {
    if (ws) return socket// Don't reconnect if already opening/open

    // @ts-ignore - options will be cast as string regardless of what is passed
    ws = new WebSocket(`wss://ittysockets.io/r/${id??''}?${new URLSearchParams(options)}`)

    ws.onopen = () => {
      while (queue.length) ws?.send(queue.shift()!)
      for (let listener of events.open || [])
        listener()
      if (closeAfterSend) ws?.close()
    }

    ws.onmessage = (
      event: any,
      parsed = JSON.parse(event.data)
    ) => {
      for (let listener of events.message || [])
        listener({ ...parsed, date: new Date(parsed.date) })
    }

    ws.onclose = () => {
      closeAfterSend = 0
      ws = null
      for (let listener of events.close || [])
        listener()
    }

    return socket
  }

  // @ts-ignore
  const socket = new Proxy(open, {
    get: (_, key: AllowedProperty) =>
      ({
        open,
        close: () => (ws?.readyState == 1 ? ws.close() : (closeAfterSend = 1), socket),
        send: (message: any, recipient?: string) => {
          message = JSON.stringify(message)
          message = recipient ? `@@${recipient}@@${message}` : message
          if (ws?.readyState == 1) return ws.send(message) ?? socket
          queue.push(message)
          return open()
        },
        push: (message: any, recipient?: string) => (closeAfterSend = 1, socket.send(message, recipient)),
        on: (type: IttySocketEvent, listener: () => any) => {
          (events[type] || (events[type] = [])).push(listener)
          return open()
        },
        off: (
          type: IttySocketEvent,
          listener: () => any,
          listeners = events[type],
          i = listeners?.indexOf(listener) || -1
        ) => (
          ~i && listeners?.splice(i, 1)
        ),
      })[key]
  }) as IttySocket

  return socket
}

// GENERICS TESTING
// connect('test')
//   .on('message', (e) => console.log(e.message.name)) // OK
//   .on<{ age: number }>('message', (e) => console.log(e.message.name)) // TS error
//   .on('close', () => console.log('close')) // OK
//   .on<{ x: number }>('message', (e) => parseInt(e.message.x)) // TS error
//   .on<{ x: string }>('message', (e) => parseInt(e.message.x)) // OK
//   .send(123) // OK
//   .send<string>(123) // TS error