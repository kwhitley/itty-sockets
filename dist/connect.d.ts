type Timestamp = {
    date: number;
};
type UserDetails = {
    uid: string;
    alias?: string;
};
type EventBase = Timestamp & {
    uid?: string;
    alias?: string;
};
export type IttyProtocol = UserDetails & Timestamp;
export type MessageEvent<T = any> = {
    message: T;
} & EventBase;
export type JoinEvent = {
    type: 'join';
    users: number;
} & EventBase;
export type LeaveEvent = {
    type: 'leave';
    users: number;
} & EventBase;
export type ErrorEvent = {
    type: 'error';
    message: string;
} & Timestamp;
export type IttySocketOptions = {
    as?: string;
    alias?: string;
    echo?: true;
    announce?: true;
};
type EventUnion<Events> = {
    [K in Exclude<keyof Events & string, 'message'>]: {
        type: K;
    } & Events[K];
}[Exclude<keyof Events & string, 'message'>] | (Events extends {
    message: infer M;
} ? M : never);
type SendFn<Base, Events extends Record<string, any>> = keyof Events extends never ? <T = any>(message: T, ...args: Base extends IttyProtocol ? [uid?: string] : []) => IttySocket<Base, Events> : (message: EventUnion<Events>, ...args: Base extends IttyProtocol ? [uid?: string] : []) => IttySocket<Base, Events>;
type EmptyEvents = {};
export interface IttySocketConnect {
    <Events extends Record<string, any> = EmptyEvents>(url: `ws://${string}` | `wss://${string}`, queryParams?: any): IttySocket<object, Events>;
    <Events extends Record<string, any> = EmptyEvents>(channelID: string, options?: IttySocketOptions): IttySocket<IttyProtocol, Events>;
}
export type IttySocket<Base = object, Events extends Record<string, any> = EmptyEvents> = {
    open: () => IttySocket<Base, Events>;
    close: () => IttySocket<Base, Events>;
    send: SendFn<Base, Events>;
    push: SendFn<Base, Events>;
    remove(type: string, listener: (...args: any[]) => any): IttySocket<Base, Events>;
    on(type: 'open', listener: () => any): IttySocket<Base, Events>;
    on(type: 'close', listener: () => any): IttySocket<Base, Events>;
    on<K extends keyof Events & string>(type: K, listener: (event: Base & Events[K] & {
        type: K;
        message: Events[K];
    }) => any): IttySocket<Base, Events>;
    on<T = any>(type: 'message', listener: (event: Base & T & {
        message: T;
    }) => any): IttySocket<Base, Events>;
} & (Base extends IttyProtocol ? {
    on(type: 'join', listener: (event: JoinEvent) => any): IttySocket<Base, Events>;
    on(type: 'leave', listener: (event: LeaveEvent) => any): IttySocket<Base, Events>;
    on(type: 'error', listener: (event: ErrorEvent) => any): IttySocket<Base, Events>;
    on<T = Record<string, any>, K extends string = string>(type: K extends 'open' | 'close' | 'message' | 'join' | 'leave' | 'error' | keyof Events ? never : K, listener: (event: Base & T & {
        type: string;
        message: T;
    }) => any): IttySocket<Base, Events>;
    on<T = Record<string, any>>(type: (event?: any) => any, listener: (event: Base & T & {
        type: string;
        message: T;
    }) => any): IttySocket<Base, Events>;
} : {
    on<T = Record<string, any>, K extends string = string>(type: K extends 'open' | 'close' | 'message' | keyof Events ? never : K, listener: (event: Base & T & {
        type: string;
        message: T;
    }) => any): IttySocket<Base, Events>;
    on<T = Record<string, any>>(type: (event?: any) => any, listener: (event: Base & T & {
        type: string;
        message: T;
    }) => any): IttySocket<Base, Events>;
});
export declare let connect: IttySocketConnect;
export {};
