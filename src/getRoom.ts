type Message = {
  id: string
  date: string
  message: any
}

type Listener = (message: Message) => void

export const getRoom = (id: string) => {
  let ws: WebSocket | null,
    queue: string[] = [],
    listeners: Listener[] = []

  const connect = () => {
    if (ws) return // Don't reconnect if already opening/open

    ws = new WebSocket('ws://localhost:3000/ws/'+id)

    ws.onopen = () => {
      // @ts-ignore
      while (queue.length) ws?.send(queue.shift())
    }

    ws.onmessage = (event) => {
      try {
        let { date, ...other } = JSON.parse(event.data)
        listeners.forEach(fn => fn({ date: new Date(date), ...other }))
      } catch {}
    }

    ws.onclose = () => {
      ws = null // Allow reconnects
    }
  }

  return new Proxy(() => {}, {
    get: (_, key, __) => {
      if (key === 'send') return (message: any) => {
        const payload = JSON.stringify(message)
        if (ws?.readyState == 1) {
          ws.send(payload) // Send immediately if open
        } else {
          queue.push(payload) // Queue if not open
          connect() // Ensure connection opens
        }
        return __ // Ensure chaining
      }

      if (key === 'push') return (message: any) => 
        __.send(message).close()

      if (key === 'listen') return (listener: Listener) => {
        listeners.push(listener)
        connect() // Ensure connection opens to listen
        return __ // Ensure chaining
      }

      if (key === 'close') return () => {
        if (!ws || ws.readyState == 3) return __
        if (ws.readyState > 0) {
          ws.close()
          ws = null
        }
        return __
      }
    }
  })
}