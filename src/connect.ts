type IttySocketEvent<BaseFormat> = BaseFormat extends IttyProtocol
  ? 'open' | 'close' | 'message' | 'join' | 'leave'
  : 'open' | 'close' | 'message'

type Timestamp = { date: number }
type UserDetails = { uid: string, alias?: string }
type OptionalUserDetails = { uid?: string, alias?: string }

export type IttyProtocol<MessageType = any> = {
  message: MessageType
} & UserDetails & Timestamp

type ExtractMessage<T> = T extends IttyProtocol<infer M> ? unknown extends M ? unknown : M : T
type WrapItty<T> = unknown extends T ? IttyProtocol<T> : T extends IttyProtocol ? T : IttyProtocol<T>

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

export interface IttySocketConnect {
  // custom WebSocket server — detected by wss:// or ws:// prefix
  <BaseFormat = object>(url: `wss://${string}`, queryParams?: any): IttySocket<BaseFormat>
  <BaseFormat = object>(url: `ws://${string}`, queryParams?: any): IttySocket<BaseFormat>
  // itty protocol — default for channel names
  <MessageType = any>(channelID: string, options?: IttySocketOptions): IttySocket<WrapItty<MessageType>>
}

type IttyProtocolEvents<BaseFormat> = {
  on(type: 'join', listener: (event: JoinEvent) => any): IttySocket<BaseFormat>
  on(type: 'leave', listener: (event: LeaveEvent) => any): IttySocket<BaseFormat>
  on(type: 'error', listener: (event: ErrorEvent) => any): IttySocket<BaseFormat>
}

type SendMessage<BaseFormat> = BaseFormat extends IttyProtocol
  ? <MessageFormat = any>(message: MessageFormat, uid?: string) => IttySocket<BaseFormat>
  : <MessageFormat = any>(message: MessageFormat) => IttySocket<BaseFormat>

export type IttySocket<BaseFormat = object> = {
  open: () => IttySocket<BaseFormat>
  close: () => IttySocket<BaseFormat>
  send: SendMessage<BaseFormat>
  push: SendMessage<BaseFormat>
  remove(type: IttySocketEvent<BaseFormat>, listener: () => any): IttySocket<BaseFormat>
  remove(type: string, listener: () => any): IttySocket<BaseFormat>

  // EVENTS
  on(type: 'open', listener: () => any): IttySocket<BaseFormat>
  on(type: 'close', listener: () => any): IttySocket<BaseFormat>
  on<MessageFormat = ExtractMessage<BaseFormat>>(type: 'message', listener: (event: BaseFormat & MessageFormat) => any): IttySocket<BaseFormat>
  on<MessageFormat = ExtractMessage<BaseFormat>>(type: string, listener: (event: BaseFormat & MessageFormat & { type: string }) => any): IttySocket<BaseFormat>
  on<MessageFormat = ExtractMessage<BaseFormat>>(type: (event?: any) => any, listener: (event: BaseFormat & MessageFormat & { type: string }) => any): IttySocket<BaseFormat>
} & (BaseFormat extends IttyProtocol ? IttyProtocolEvents<BaseFormat> : object)

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

type FooType = { foo: string }

const channel = connect('test')

// this should throw a TS error because of the top-level unknown type
channel.on('message', ({ foo, uid, message, date }) => {
  console.log(uid, message, date)
})