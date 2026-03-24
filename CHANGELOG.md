## Changelog
CAUTION: Pre v1.0.0, this should be considered an alpha release, with minor updates allowing for breaking changes to the interface.

#### v0.9.0
- breaking: join.users is now an array of users (previously number of users), only sent when connecting with { list: true }
- breaking: join.total is the total user count (previously join.users)
- added: join.self flag is true to self-identify
- added: join.uid + join.alias is sent on self-identity message (regardless of announce)
- join.users list only includes self-announcing users, with self.true flag for own entry
#### v0.8.2
- fixed: TS should be strict for join/leave events when using IttyProtocol
- fixed: remove should be loosely typed to allow any function removal
#### v0.8.1
- fixed: .send<MessageType>() types were incorrect - this has been restored
- added: full type coverage to protect during future refactors
#### v0.8.0
- breaking: changed the generics for connect<EventMap>() - this was likely never used by anyone
- added: now the types pivot based on wss: string or simple string (IttyProtocol)
- preserved: .on/.send level generics
#### v0.7.0
- added: .on('*', listener) to respond to *any* messages (e.g. normal, custom, join, leave, error, etc)
#### v0.6.0
- added: .on('custom-type', listener) support, keying off payload.type
- added: .on(filterFunction, listener) support to route listeners based on custom payload rules
- added: .on('message', listener) still works, catching *all* user-sent messages
- added: full TypeScript generics support for .on and .send functions
- added: for convenience, we now destructure the message payload into the top-level event (before the event props)
- breaking: removed Date casting of event.date, now left as numeric timestamp
#### v0.5.0
- BREAKING: removed base (url) option - instead, simply pass a full wss:// path as the channelId to use an external compatible server.
#### v0.4.0
- added: base (url) option
#### v0.3.1
- fixes: module export
- removes extra NPM files
#### v0.3.0
- breaking: every event has multiple listeners (previously only on('message') allowed multiple)
- added: join/leave/error event types
- added: .remove('event-name', listener) to remove listeners
#### v0.2.3
- fix type hinting on listeners
- improve type hinting on send/push
#### v0.2.0
- alpha release 2
#### v0.1.0
- alpha release 1
