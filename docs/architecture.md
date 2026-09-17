# GoreeCloud Memos — Initial Architecture

**Status:** Development architecture for the first vertical slice only.

## Current implemented path

```text
web/index.html + web/app.mjs
        |
        v
src/app/memo-service.mjs
        |
        +--> src/domain/memo.mjs
        |
        v
src/storage/indexeddb-memo-store.mjs
        |
        v
Browser IndexedDB
```

The UI depends on the application service, the application service depends on a small storage interface, and the browser-specific storage adapter implements that interface. The domain model has no browser dependency.

## Not yet designed or implemented

- Authoritative server datastore.
- Server API and synchronization protocol.
- Device identity and authorization.
- Offline mutation queue and reconciliation.
- Attachment storage.
- Search indexing.
- Desktop/mobile local database technology.
- GoreeCloud platform-system runtime contracts.

No future architecture decision is implied merely by the presence of the current browser adapter.
