# GoreeCloud Memos — Development Privacy Policy

**Status:** Development; applies only to the current local browser implementation slice.

## Current data handling

The current slice does not implement a server, account system, telemetry service, advertising system, analytics integration, external AI service, or external metadata lookup.

Saved memos are stored in the browser's IndexedDB storage for the local site origin. In-progress draft content is stored in browser local storage. The application source does not intentionally transmit memo content to GoreeCloud or another external service.

## User control

Users can delete individual saved memos from the current interface. Because a recoverable Trash feature is not yet implemented, this local delete is immediate from the application's memo store. Users may also clear browser site data through their browser controls, which can remove saved memos and drafts.

## Future features

Future server, synchronization, account, sharing, attachment, observability, and administration features will require corresponding privacy controls and documentation before they can be represented as implemented or production-ready.
