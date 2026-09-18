# GoreeCloud Memos — Initial Architecture

**Status:** Development architecture for the first vertical slice only.

## Current implemented path

```text
web/index.html + web/app.mjs
        |
        v
src/app/memo-service.mjs
src/app/label-service.mjs
src/app/saved-view-service.mjs
        |
        +--> src/domain/memo.mjs
        +--> src/domain/label.mjs
        +--> src/domain/saved-view.mjs
        |
        v
src/storage/indexeddb-memo-store.mjs
        |
        v
Browser IndexedDB
```

The UI depends on narrow application services for memo, managed-label, and Saved View behavior. Those services depend on storage operations and browser-independent domain validation; the browser-specific IndexedDB adapter implements persistence. Memo v4, Label v2, and Saved View v1 remain distinct record contracts, and the domain models have no browser dependency.

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
