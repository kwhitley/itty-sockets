export type AllowedProperty = 'ws' | 'send' | 'push' | 'listen' | 'close'

export type MessageEvent<MessageType = any> = {
  date: Date
  uid?: string
  alias?: string
  message: MessageType
}

export type SendMessage = <MessageFormat = any>(message: MessageFormat, recipient?: string) => IttySocket

export type IttySocket = {
  ws?: WebSocket,
  send: SendMessage,
  push: SendMessage,
  listen: <MessageType = any>(
    listener: (event: MessageEvent<MessageType>) => any,
    when?: (event: MessageEvent<MessageType>) => any,
  ) => IttySocket,
  close: () => IttySocket,
}

export type IttySocketOptions = {
  as?: string,
  alias?: string,
  echo?: boolean,
}

export const connect = (id: string, options: IttySocketOptions = {}): IttySocket => {
  let ws: WebSocket | null,
    queue: string[] = [],
    listeners: Array<(event: MessageEvent) => any> = [],
    closeAfterSend = 0

  let connect = () => {
    if (ws) return // Don't reconnect if already opening/open

    // @ts-ignore - options will be cast as string regardless of what is passed
    ws = new WebSocket(`wss://ittysockets.io/r/${id??''}?${new URLSearchParams(options)}`)

    ws.onopen = () => {
      while (queue.length) ws?.send(queue.shift()!)
      if (closeAfterSend) ws?.close()
    }

    ws.onmessage = (
      event: any,
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
        send: (message: any, recipient?: string) => {
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
        listen: <MessageType = any>(
          listener: (event: MessageEvent<MessageType>) => any,
          when?: (event: MessageEvent<MessageType>) => boolean
        ) => {
          listeners.push((event: MessageEvent<any>) =>
            (!when || when(event as MessageEvent<MessageType>)) && listener(event as MessageEvent<MessageType>)
          )
          return connect() ?? __
        },
        close: () => (ws?.readyState == 1 ? ws.close() : (closeAfterSend = 1), __)
      })[key]
  })
}

// type FooMessage = {
//   name: string
//   age: number
//   pets: string[]
// }
// type XYMessage = {
//   x: number
//   y: number
// }

// connect('test', {
//   as: 'test-user',
// })

// connect('test')
//   .listen<FooMessage>(({ message }) => {
//     console.log(message.name)
//   }, (msg) => msg.message.name)
//   .listen<XYMessage>(({ message }) => {
//     console.log(message.x, message.y)
//   }, (msg) => msg.message.x !== undefined)
//   .listen<{ x: number }>(e => e.message.foo == 'bar')
//   .push<{ x: number }>({ foo: 'bar' })
