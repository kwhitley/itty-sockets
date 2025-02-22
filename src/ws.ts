
type AllowedProperty = 'ws' | 'send' | 'push' | 'listen' | 'close'

type SendMessage = <MessageFormat = any>(message: MessageFormat) => Connection

type Connection = {
  ws?: WebSocket | undefined,
  send: SendMessage,
  push: SendMessage,
  listen: <MessageType = any>(
    listener: (message: MessageType) => any,
    when?: (message: MessageType) => any,
  ) => Connection,
  close: () => Connection,
}

type ConnectionOptions = {
  json?: boolean,
}

export const ws = (url: string, options: ConnectionOptions = {}): Connection => {
  let ws: WebSocket | undefined,
    queue: string[] = [],
    listeners: Array<(message: any) => any> = [],
    closeAfterSend = 0

  let connect = () => {
    if (ws) return // Don't reconnect if already opening/open
    ws = new WebSocket(url)

    ws.onopen = () => {
      while (queue.length) ws?.send(queue.shift()!)
      if (closeAfterSend) ws?.close()
    }

    ws.onmessage = (
      event: MessageEvent,
      message = options.json ? JSON.parse(event.data) : event.data,
    ) => {
      for (let listener of listeners)
        listener(message)
    }

    ws.onclose = () => (closeAfterSend = 0, ws = undefined)
  }

  // @ts-ignore
  return new Proxy(connect, {
    get: (_, key: AllowedProperty, __) =>
      ({
        ws,
        send: (message: any) => {
          message = options.json ? JSON.stringify(message) : message
          if (ws?.readyState == 1) return ws.send(message) ?? __
          queue.push(message)
          return connect() ?? __
        },
        push: (message: any) => {
          closeAfterSend = 1
          return __.send(message)
        },
        listen: <T = any>(listener: (message: T) => any, when?: (message: T) => any) => {
          listeners.push(msg => (when && when(msg) || true) && listener(msg))
          return connect() ?? __
        },
        // @ts-ignore
        close: () => (ws?.readyState == 1 ? ws.close() : (closeAfterSend = 1), __)
      })[key]
  })
}

// type CustomMessage = {
//   foo: string,
//   age: number,
// }

// type XYMessage = {
//   x: number,
//   y: number,
// }

// const checker = (message: XYMessage) => message.age === 1

// ws('wss://localhost:8080', { json: true })
//   .listen<CustomMessage>(message => {
//     console.log(message.foo)
//   }, checker)
//   .send<{ x: number }>({ foo: 'bar' })
//   .push<{ x: number }>({ foo: 'bar' })
