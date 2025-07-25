## Changelog
CAUTION: Pre v1.0.0, this should be considered an alpha release, with minor updates allowing for breaking changes to the interface.

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
