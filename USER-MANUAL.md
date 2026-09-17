# GoreeCloud Memos — Development User Manual

**Applies to:** current local browser development slice only.

## Start the application

From the repository root, run:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173/web/` in a modern browser with IndexedDB support.

## Capture a memo

1. Optionally enter a title.
2. Enter memo content.
3. Select **Save memo**.
4. The memo is stored in that browser's local IndexedDB database and appears in the Memos list.

Text entered into the composer is also preserved locally as a draft while typing. A successfully saved memo clears that draft.

## Delete a memo

Select **Delete** on a memo card. In this development slice, deletion is immediate local removal. The roadmap's recoverable Trash behavior is not implemented yet.

## Data boundary

This development slice has no server or synchronization service. Data stored in one browser profile is not available from another browser, device, or profile. Clearing site data can remove local memos and drafts.

## Validation commands

```bash
npm run check
npm test
```

## Current limitations

Accounts, synchronization, attachments, labels, colors, archive/trash, search, import/export, backups, native clients, administration, and Stable release qualification are not implemented.
