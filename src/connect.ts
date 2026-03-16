type Timestamp = { date: number }
type UserDetails = { uid: string, alias?: string }
type EventBase = Timestamp & { uid?: string, alias?: string }

export type IttyProtocol = UserDetails & Timestamp
export type MessageEvent<T = any> = { message: T } & EventBase
export type JoinEvent = { type: 'join', users: number } & EventBase
export type LeaveEvent = { type: 'leave', users: number } & EventBase
export type ErrorEvent = { type: 'error', message: string } & Timestamp

export type IttySocketOptions = {
  as?: string,
  alias?: string,
  echo?: true,
  announce?: true,
}

// typed events get { type: K }, 'message' key passes through as-is
type EventUnion<Events> = {
  [K in Exclude<keyof Events & string, 'message'>]: { type: K } & Events[K]
}[Exclude<keyof Events & string, 'message'>]
  | (Events extends { message: infer M } ? M : never)

type SendFn<Base, Events extends Record<string, any>> =
  keyof Events extends never
    ? <T = any>(message: T, ...args: Base extends IttyProtocol ? [uid?: string] : []) => IttySocket<Base, Events>
    : (message: EventUnion<Events>, ...args: Base extends IttyProtocol ? [uid?: string] : []) => IttySocket<Base, Events>

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type EmptyEvents = {}

export interface IttySocketConnect {
  <Events extends Record<string, any> = EmptyEvents>(url: `ws://${string}` | `wss://${string}`, queryParams?: any): IttySocket<object, Events>
  <Events extends Record<string, any> = EmptyEvents>(channelID: string, options?: IttySocketOptions): IttySocket<IttyProtocol, Events>
}

export type IttySocket<Base = object, Events extends Record<string, any> = EmptyEvents> = {
  open: () => IttySocket<Base, Events>
  close: () => IttySocket<Base, Events>
  send: SendFn<Base, Events>
  push: SendFn<Base, Events>
  remove(type: string, listener: (...args: any[]) => any): IttySocket<Base, Events>

  // EVENTS
  on(type: 'open', listener: () => any): IttySocket<Base, Events>
  on(type: 'close', listener: () => any): IttySocket<Base, Events>
  on<K extends keyof Events & string>(type: K, listener: (event: Base & Events[K] & { type: K, message: Events[K] }) => any): IttySocket<Base, Events>
  on<T = any>(type: 'message', listener: (event: Base & T & { message: T }) => any): IttySocket<Base, Events>
} & (Base extends IttyProtocol ? {
  on(type: 'join', listener: (event: JoinEvent) => any): IttySocket<Base, Events>
  on(type: 'leave', listener: (event: LeaveEvent) => any): IttySocket<Base, Events>
  on(type: 'error', listener: (event: ErrorEvent) => any): IttySocket<Base, Events>
  on<T = Record<string, any>, K extends string = string>(type: K extends 'open' | 'close' | 'message' | 'join' | 'leave' | 'error' | keyof Events ? never : K, listener: (event: Base & T & { type: string, message: T }) => any): IttySocket<Base, Events>
  on<T = Record<string, any>>(type: (event?: any) => any, listener: (event: Base & T & { type: string, message: T }) => any): IttySocket<Base, Events>
} : {
  on<T = Record<string, any>, K extends string = string>(type: K extends 'open' | 'close' | 'message' | keyof Events ? never : K, listener: (event: Base & T & { type: string, message: T }) => any): IttySocket<Base, Events>
  on<T = Record<string, any>>(type: (event?: any) => any, listener: (event: Base & T & { type: string, message: T }) => any): IttySocket<Base, Events>
})

export let connect: IttySocketConnect = (channelId: string, options = {}) => {
  let ws: WebSocket | null,
      closeAfterSend: any,
      queue: string[] = [],
      events: Record<string, Array<(event?: any) => any>> = {}

  let open = () => (
    ws || (
      // @ts-ignore - options will be cast as string regardless of what is passed
      ws = new WebSocket((/^wss?:/.test(channelId) ? channelId : 'wss://itty.ws/c/' + channelId) + '?' + new URLSearchParams(options)),

      ws.onmessage = (
        event: any,
        parsed = JSON.parse(event.data),
        payload = parsed?.message,
        eventPayload = {
          ...(payload?.[0] == null && payload),
          ...parsed,
        },
      ) =>
        [eventPayload.type, parsed.type ? 0 : 'message', '*'].map(key =>
          events[key]?.map(listener => listener(eventPayload))
        ),

      ws.onopen = () => (
        queue.splice(0).map(m => ws!.send(m)),
        events.open?.map(listener => listener(closeAfterSend)),
        closeAfterSend && ws?.close()
      ),

      ws.onclose = () => (
        closeAfterSend = ws = null,
        events.close?.map(listener => listener(closeAfterSend))
      )
    ),
    socket
  )

  let socket: any = {
    open,
    send: (message: any, recipient?: string) => (
      message = (recipient ? `\x1F${recipient}\x1F` : '') + JSON.stringify(message),
      // @ts-ignore
      ws?.readyState & 1 ? ws!.send(message) : queue.push(message),
      open()
    ),
    on: (type: any, listener: (e?: any) => any) => (
      (events[type?.[0] ? type : '*'] ??= []).push(type?.[0] ? listener : (e: any) => type?.(e) && listener(e)),
      open()
    ),
    remove: (type: any, listener: (...args: any[]) => any) => (
      events[type] = events[type]?.filter((l: any) => l != listener),
      socket
    ),
    // @ts-ignore
    close: () => (ws?.readyState & 1 ? ws!.close() : closeAfterSend = 1, socket),
    push: (message: any, recipient?: string) => (closeAfterSend = 1, socket.send(message, recipient!)),
  }

  return socket
}