type Message = {
  // id: string
  date: Date
  from: string
  alias?: string
  message: any
}

type Listener = (message: Message) => void

export const channel = (id: string, options?: Record<string, any>) => {
  let ws: WebSocket | null,
    queue: string[] = [],
    listeners: Listener[] = [],
    closeAfterSend = 0

  return new Proxy(() => {}, {
    get: (_, key, __) => {
      const connect = () => {
        if (ws) return __ // Don't reconnect if already opening/open
    
        ws = new WebSocket('wss://ittysockets.io/r/'+(id??'') + (options ? `?${new URLSearchParams(options).toString()}` : ''))
    
        ws.onopen = () => {
          // @ts-ignore
          while (queue.length) ws?.send(queue.shift())
          if (closeAfterSend) ws?.close()
        }
    
        ws.onmessage = (event: MessageEvent) => {
          try {
            let parsed = JSON.parse(event.data)
            for (let listener of listeners) {
              listener({ date: new Date(parsed.date), ...parsed })
            }
          } catch {}
        }
    
        ws.onclose = () => { 
          closeAfterSend = 0
          ws = null 
        }
      }

      if (key == 'ws') return ws // expose the websocket instance directly
      
      if (key == 'send') return (message: any) => {
        const payload = JSON.stringify(message)
        if (ws?.readyState == 1) return ws.send(payload) ?? __
        queue.push(payload)
        return connect() ?? __
      }

      if (key == 'push') 
        return (message: any) => (closeAfterSend = 1, __.send(message))

      if (key === 'listen') 
        return (listener: Listener) => {
          listeners.push(listener)
          return connect() ?? __
        }

      if (key == 'close') 
        return () => (ws?.readyState == 1 ? ws.close() : (closeAfterSend = 1), __)
    }
  })
}