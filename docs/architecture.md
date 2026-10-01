# GoreeCloud Memos — Initial Architecture

**Status:** Development architecture for the current browser-local and native Android local-capture foundations.

## Current implemented paths

### Browser-local application

```text
web/index.html
  +--> web/app.mjs
  +--> web/shell-ui.mjs
  +--> web/onboarding.mjs
  +--> web/label-admin.mjs
  +--> web/bulk-labels.mjs
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

The browser shell, onboarding, managed-label administration, and bulk-label enhancement modules coordinate through explicit DOM events around one browser-local persistence boundary. The primary memo renderer publishes lifecycle/label snapshots after each committed refresh; enhancement modules consume those snapshots rather than inventing separate memo authority. Memo actions/editors hydrate on demand, and large result sets are progressively materialized to bound initial DOM work.

Application services remain narrow and depend on storage operations plus browser-independent domain validation. Memo v4, Label v2, and Saved View v1 remain distinct record contracts; domain models do not depend on the browser.

### Native Android Development foundation

```text
android application UI
        |
        v
local memo / draft persistence codecs
        |
        v
application-private local files
```

The Android path is a first-party native local-capture Development foundation. It intentionally has no accepted server/synchronization authority and requests no Internet permission in the current Development package. Its local persistence and recovery evidence are separate from the browser IndexedDB contract.

## Not yet designed or implemented

- Authoritative server datastore.
- Server API and synchronization protocol.
- Device identity and authorization.
- Offline mutation queue and reconciliation.
- Attachment storage.
- Search indexing.
- Native desktop persistence technology and any synchronized/shared mobile storage contract.
- GoreeCloud platform-system runtime contracts.

No future architecture decision is implied merely by the presence of the current browser adapter.
