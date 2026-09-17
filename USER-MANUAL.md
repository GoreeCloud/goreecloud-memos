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
4. The memo is stored in that browser's local IndexedDB database and appears in **Memos**.

Text entered into the composer is preserved locally as a draft while typing. Reloading the page restores that draft. A successfully saved memo clears the composer draft.

## Edit a memo

1. In **Memos**, select **Edit** on a memo card.
2. Change the title or memo content.
3. Changes save automatically after a short pause in typing.
4. Wait for **Saved.** before closing the page when you need confirmation that the most recent edit was written locally.

Memo content cannot be saved as blank.

## Archive and restore

Select **Archive** on an active memo to remove it from the main Memos view without deleting it. Open **Archive** to view archived memos. Select **Restore** to return an archived memo to **Memos**.

## Trash and recovery

Select **Move to Trash** from Memos or Archive. Open **Trash** to view trashed memos.

Select **Restore** in Trash to return the memo to the location it came from. A memo trashed from Archive returns to Archive; a memo trashed from Memos returns to Memos.

**Delete permanently** is available only in Trash and requires an explicit confirmation. Permanent deletion cannot be undone by this development slice.

## Data migration

The local memo record format is currently schema v2. When this development slice opens a schema v1 IndexedDB database created by the first repository implementation, it migrates those memo records to v2 while preserving their core content and timestamps.

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

Accounts, synchronization, attachments, labels, colors, pin controls, checklists, reminders, search, import/export, backups, native clients, administration, and Stable release qualification are not implemented.
