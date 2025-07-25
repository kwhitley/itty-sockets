export type IttySocketEvent = 'open' | 'close' | 'message' | 'join' | 'leave';
type Date = {
    date: Date;
};
type UserDetails = {
    uid: string;
    alias?: string;
};
type OptionalUserDetails = {
    uid?: string;
    alias?: string;
};
export type MessageEvent<MessageType = any> = {
    message: MessageType;
} & Date & UserDetails & MessageType;
export type JoinEvent = {
    type: 'join';
    users: number;
} & Date & OptionalUserDetails;
export type LeaveEvent = {
    type: 'leave';
    users: number;
} & Date & OptionalUserDetails;
export type ErrorEvent = {
    type: 'error';
    message: string;
} & Date;
export type SendMessage = <MessageFormat = any>(message: MessageFormat, recipient?: string) => IttySocket;
export type IttySocket = {
    open: () => IttySocket;
    close: () => IttySocket;
    connected: boolean;
    send: SendMessage;
    push: SendMessage;
    on(type: 'join', listener: (event: JoinEvent) => any): IttySocket;
    on(type: 'leave', listener: (event: LeaveEvent) => any): IttySocket;
    on(type: 'error', listener: (event: ErrorEvent) => any): IttySocket;
    on<MessageFormat = any>(type: 'message', listener: (event: MessageEvent<MessageFormat>) => any): IttySocket;
    on<MessageFormat = any>(type: string, listener: (event: MessageEvent<MessageFormat & {
        type: string;
    }>) => any): IttySocket;
    on<MessageFormat = any>(type: (event?: any) => any, listener: (event: MessageEvent<MessageFormat & {
        type: string;
    }>) => any): IttySocket;
    remove(type: IttySocketEvent, listener: () => any): IttySocket;
};
export type IttySocketOptions = {
    as?: string;
    alias?: string;
    echo?: true;
    announce?: true;
};
export declare let connect: (channelId: string, options?: IttySocketOptions) => IttySocket;
export {};
