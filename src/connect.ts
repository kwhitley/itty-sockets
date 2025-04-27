export type AllowedProperty = 'ws' | 'send' | 'push' | 'close' | 'open' | 'on'

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
  on: <T extends string, MessageType = any>(
    type: T,
    listener: T extends 'message' ? (event: MessageEvent<MessageType>) => any : () => any,
  ) => IttySocket,
  in: (fn: Function) => IttySocket,
  out: (fn: Function) => IttySocket,
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
    closeAfterSend = 0,
    events: Record<string, any> = {}

  let open = () => {
    if (ws) return // Don't reconnect if already opening/open

    // @ts-ignore - options will be cast as string regardless of what is passed
    ws = new WebSocket(`wss://ittysockets.io/r/${id??''}?${new URLSearchParams(options)}`)

    ws.onopen = () => {
      while (queue.length) ws?.send(queue.shift()!)
      events.open?.()
      if (closeAfterSend) ws?.close()
    }

    ws.onmessage = (
      event: any,
      parsed = JSON.parse(event.data),
    ) => {
      for (let listener of listeners)
        listener({ ...parsed, date: new Date(parsed.date) })
    }

    ws.onclose = () => (closeAfterSend = 0, ws = null, events.close?.())
  }

  // @ts-ignore
  return new Proxy(open, {
    get: (_, key: AllowedProperty, __) =>
      ({
        ws,
        open,
        on: <T extends string, MessageType = any>(
          type: T,
          listener: T extends 'message' ? (event: MessageEvent<MessageType>) => any : () => any,
        ) => {
          events[type] = listener

          if (type == 'message') {
            listeners.push(listener)
            open()
          }

          return __
        },
        send: (message: any, recipient?: string) => {
          message = JSON.stringify(message)
          message = recipient ? `@@${recipient}@@${message}` : message
          if (ws?.readyState == 1) return ws.send(message) ?? __
          queue.push(message)

          return open() ?? __
        },
        push: (message: any, recipient?: string) => (closeAfterSend = 1, __.send(message, recipient)),
        close: () => (ws?.readyState == 1 ? ws.close() : (closeAfterSend = 1), __)
      })[key]
  })
}

// connect('test')
//   .on('close', () => {}, )
//   .on('message', (a) => console.log(a.message.name))

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

/*


const foo = connect('foo', { echo: true, as: 'Kevin' })

foo.on('message', console.log)

foo.in((msg) => {
  return { ...msg, foo: 'bar' }
})



*/