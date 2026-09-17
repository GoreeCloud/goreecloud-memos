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
2. Optionally choose a memo color.
3. Optionally enter one or more labels separated by commas.
4. Enter memo content.
5. Select **Save memo**.
6. The memo is stored in that browser's local IndexedDB database and appears in **Memos**.

Text and organization fields entered into the composer are preserved locally as a draft while typing. Reloading the page restores the draft. A successfully saved memo clears the composer draft.

Labels in this Development slice are memo-local name metadata. Names are trimmed, duplicate names are removed case-insensitively, and the first entered display spelling is retained. Central label management, label colors, rename/merge operations, filtering, and bulk label workflows are not implemented yet.

## Edit a memo

1. In **Memos**, select **Edit** on a memo card.
2. Change the title, color, labels, or memo content.
3. Changes save automatically after a short pause in typing.
4. Wait for **Saved.** before closing the page when you need confirmation that the most recent edit was written locally.

Memo content cannot be saved as blank.

## Pin and reorder memos

Select **Pin** on an active memo to place it before ordinary memos. Pinned memos retain a stored manual order.

Use **Move pin up** and **Move pin down** to change that order. The controls are disabled when a pinned memo is already at the corresponding boundary. Select **Unpin** to return the memo to ordinary update-time ordering.

Pin state and manual pin order persist across reloads in the same browser profile.

## Memo colors

The current local palette includes Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, and Gray. A memo can also have no color.

Color is stored as memo metadata. The card shows both a visual color treatment and visible `Color: …` text so color is not the sole carrier of meaning.

## Archive and restore

Select **Archive** on an active memo to remove it from the main Memos view without deleting it. Open **Archive** to view archived memos. Select **Restore** to return an archived memo to **Memos**.

## Trash and recovery

Select **Move to Trash** from Memos or Archive. Open **Trash** to view trashed memos.

Select **Restore** in Trash to return the memo to the location it came from. A memo trashed from Archive returns to Archive; a memo trashed from Memos returns to Memos.

**Delete permanently** is available only in Trash and requires an explicit confirmation. Permanent deletion cannot be undone by this development slice.

## Data migration

The local memo record format and IndexedDB database are currently version 3. Version 3 adds memo color, labels, and manual pin-order metadata.

When this Development slice opens a version 1 or version 2 `goreecloud-memos-local` database from earlier repository implementations, existing memo records are normalized to v3 during the IndexedDB upgrade transaction. Core content, timestamps, lifecycle state, and prior pin state are preserved. Older pinned records receive a deterministic initial pin order that preserves the earlier pinned-by-recency behavior until the user manually reorders them.

## Data boundary

This development slice has no server or synchronization service. Data stored in one browser profile is not available from another browser, device, or profile. Clearing site data can remove local memos and drafts. Operational backup and restore are not implemented.

## Validation commands

```bash
npm run check
npm test
```

End-to-end browser tests use the pinned Playwright development dependency:

```bash
npm install --ignore-scripts
npx playwright install chromium
npm run test:e2e
```

## Current limitations

Accounts, synchronization, attachments, managed label entities, label colors/icons/descriptions, label filtering/search, bulk label operations, checklists, reminders, full search, import/export, backups, native clients, administration, and Stable release qualification are not implemented.
