import { Predicate, AllowedProperty } from './types'

type Listener = (message: any) => any

type SendMessage = (message: any) => Connection

type Connection = {
  ws?: WebSocket | null,
  send: SendMessage,
  push: SendMessage,
  listen: (listener: Listener) => Connection,
  close: () => Connection,
}

export const ws = (url: string, options: Record<string, any> = {}): Connection => {
  let ws: WebSocket | undefined,
    queue: string[] = [],
    listeners: Listener[] = [],
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
        listen: (listener: Listener, when?: Predicate) => {
          listeners.push(msg => (when && when(msg) || true) && listener(msg))
          return connect() ?? __
        },
        // @ts-ignore
        close: () => (ws?.readyState == 1 ? ws.close() : (closeAfterSend = 1), __)
      })[key]
  })
}