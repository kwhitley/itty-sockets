type Timestamp = { date: number }
type UserDetails = { uid: string, alias?: string }
type OptionalUserDetails = { uid?: string, alias?: string }

export type IttyProtocol = UserDetails & Timestamp

export type MessageEvent<MessageType = any> = {
  message: MessageType
} & Timestamp & OptionalUserDetails

export type JoinEvent = {
  type: 'join'
  users: number
} & Timestamp & OptionalUserDetails

export type LeaveEvent = {
  type: 'leave'
  users: number
} & Timestamp & OptionalUserDetails

export type ErrorEvent = {
  type: 'error'
  message: string
} & Timestamp

export type IttySocketOptions = {
  as?: string,
  alias?: string,
  echo?: true,
  announce?: true,
}

// helper: typed events get { type: K }, 'message' key passes through as-is
type EventUnion<Events> = {
  [K in Exclude<keyof Events & string, 'message'>]: { type: K } & Events[K]
}[Exclude<keyof Events & string, 'message'>]
  | ('message' extends keyof Events ? Events['message' & keyof Events] : never)

type SendFn<Base, Events extends Record<string, any>> = Base extends IttyProtocol
  ? keyof Events extends never
    ? <T = any>(message: T, uid?: string) => IttySocket<Base, Events>
    : (message: EventUnion<Events>, uid?: string) => IttySocket<Base, Events>
  : keyof Events extends never
    ? <T = any>(message: T) => IttySocket<Base, Events>
    : (message: EventUnion<Events>) => IttySocket<Base, Events>

export interface IttySocketConnect {
  // custom WebSocket server — detected by wss:// or ws:// prefix
  <Events extends Record<string, any> = {}>(url: `wss://${string}`, queryParams?: any): IttySocket<object, Events>
  <Events extends Record<string, any> = {}>(url: `ws://${string}`, queryParams?: any): IttySocket<object, Events>
  // itty protocol — default for channel names
  <Events extends Record<string, any> = {}>(channelID: string, options?: IttySocketOptions): IttySocket<IttyProtocol, Events>
}

type IttyEvents<Base, Events extends Record<string, any>> = {
  on(type: 'join', listener: (event: JoinEvent) => any): IttySocket<Base, Events>
  on(type: 'leave', listener: (event: LeaveEvent) => any): IttySocket<Base, Events>
  on(type: 'error', listener: (event: ErrorEvent) => any): IttySocket<Base, Events>
}

type FallbackEvents<Base, Events extends Record<string, any>> = {
  on<T = Record<string, any>>(type: string, listener: (event: Base & T & { type: string }) => any): IttySocket<Base, Events>
  on<T = Record<string, any>>(type: (event?: any) => any, listener: (event: Base & T & { type: string }) => any): IttySocket<Base, Events>
}

export type IttySocket<Base = object, Events extends Record<string, any> = {}> = {
  open: () => IttySocket<Base, Events>
  close: () => IttySocket<Base, Events>
  send: SendFn<Base, Events>
  push: SendFn<Base, Events>
  remove(type: string, listener: () => any): IttySocket<Base, Events>

  // EVENTS
  on(type: 'open', listener: () => any): IttySocket<Base, Events>
  on(type: 'close', listener: () => any): IttySocket<Base, Events>
  on<K extends keyof Events & string>(type: K, listener: (event: Base & Events[K] & { type: K, message: Events[K] }) => any): IttySocket<Base, Events>
  on<T = any>(type: 'message', listener: (event: Base & { message: T }) => any): IttySocket<Base, Events>
} & (Base extends IttyProtocol ? IttyEvents<Base, Events> : object)
  & FallbackEvents<Base, Events>

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
    remove: (type: any, listener: () => any) => (
      events[type] = events[type]?.filter((l: any) => l != listener),
      socket
    ),
    // @ts-ignore
    close: () => (ws?.readyState & 1 ? ws!.close() : closeAfterSend = 1, socket),
    push: (message: any, recipient?: string) => (closeAfterSend = 1, socket.send(message, recipient!)),
  }

  return socket
}

type MyEvents = {
  'player-join': { playerId: string, team: string }
  'player-leave': { playerId: string }
  'chat': { text: string, user: string }
  'message': number[] | Record<string, any>
}

const external = connect<MyEvents>('wss://test')
  .on('player-join', ({ playerId, team }) => {})
  .send({ playerId: '123', team: 'Red' })
  .on('message', (e) => e.message)

const itty = connect<MyEvents>('my-channel')
  .on('chat', ({ text, user, date, uid }) => {})
  .on('leave', ({ users }) => {})
  .send({ type: 'chat', text: 'Hello', user: 'John' })
  .send([1,2,3])

const raw = connect('my-channel2')
  .on('chat', ({ text, user, date, uid }) => {})
  .on('leave', ({ users }) => {})
  .send({ type: 'chat', text: 'Hello', user: 'John' })
  .send([1,2,3])