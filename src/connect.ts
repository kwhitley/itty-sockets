type Message = {
  date: Date
  uid?: string
  alias?: string
  message: any
}

type Listener = (message: Message) => void

type SendMessage = (message: any, uid?: string) => void

type Connection = {
  ws: WebSocket,
  send: SendMessage,
  push: SendMessage,
  listen: (listener: Listener) => void,
  close: () => void,
}

export const connect = (id: string, options?: Record<string, any>): Connection => {
  let ws: WebSocket | null,
    queue: string[] = [],
    listeners: Listener[] = [],
    closeAfterSend = 0

  const connect = () => {
    if (ws) return // Don't reconnect if already opening/open

    ws = new WebSocket('ws://localhost:3000/r/'+(id??'') + (options ? `?${new URLSearchParams(options).toString()}` : ''))

    ws.onopen = () => {
      // @ts-ignore
      while (queue.length) ws?.send(queue.shift())
      if (closeAfterSend) ws?.close()
    }

    ws.onmessage = (event: MessageEvent, parsed = JSON.parse(event.data)) => {
      for (let listener of listeners)
        listener({ ...parsed, date: new Date(parsed.date) })
    }

    ws.onclose = () => { 
      closeAfterSend = 0
      ws = null 
    }
  }

  connect() // Connect immediately

  // @ts-ignore
  return new Proxy(() => {}, {
    get: (_, key, __) => {
      // @ts-ignore
      return ({
        ws,
        send: (message: any, recipient?: string) => {
            let payload = recipient 
            ? `@@${recipient}@@${JSON.stringify(message)}`
            : JSON.stringify(message)

            if (ws?.readyState == 1) 
              return ws.send(payload) ?? __
            
            queue.push(payload)
            connect()
            return __
        },
        push: (message: string, recipient?: string) => __.send(message, recipient).close(),
        listen: (listener: Listener) => {
          listeners.push(listener)
          connect()
          return __
        },
        close: () => (ws?.readyState == 1 ? ws.close() : (closeAfterSend = 1), __)
      })[key]
    }
  })
}

/*
proposed message syntax:

{
  uid: string,
  as?: string,
  date: Date,
  message: any,
}

{
  // no uid implies sytem message
  date: Date,
  message: any,
}

*/
