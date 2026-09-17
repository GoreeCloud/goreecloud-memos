# GoreeCloud Memos — Repository Notes

## Current implementation notes

- Canonical repository baseline before this implementation was a single `README.md` on `main`.
- The first implementation branch is `feature/local-quick-capture-foundation`.
- Current persistence is browser-local IndexedDB. It is intentionally not represented as the final desktop/mobile local database or server datastore.
- Local draft recovery currently uses local storage.
- No third-party runtime dependencies are required by the initial browser slice.
- No external network requests are made by application code in the initial slice.

## Governance and infrastructure follow-up

- `main` was verified as unprotected before this work. Default-branch protection remains required by repository governance but could not be configured through the available GitHub connector actions.
- Repository self-hosted runner labels could not be enumerated through the available connector. CI therefore starts on GitHub-hosted runners; self-hosted routing must be added only after the actual runner labels and trust boundary are verified.
- The central GoreeCloud user-manual representation must remain synchronized with `USER-MANUAL.md` as the product evolves.
- The legacy Memos Google Doc changelog still requires controlled Markdown migration; it remains historical evidence and is not an implementation authority for current source state.
