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

Label input still looks like simple comma-separated names. Internally, the current Development slice maps those names to managed local Label identities with stable UUIDs and Memo–Label relationships. Names are trimmed and duplicate input is removed case-insensitively. Existing managed identity is reused for the same normalized name.

## Manage labels

The **Manage labels** panel works only with managed labels already created by memo capture or editing.

- **Rename** changes the label's display name while preserving its stable identity. All affected memo label displays/search projections update together. Renaming to a name already used by another managed label is rejected; use Merge instead.
- **Merge** moves every relationship from the source label to the selected target label, deduplicates memos that already had both labels, updates memo projections, and removes the source label.
- **Delete** explicitly removes the label from every related memo and deletes the managed Label identity. It does **not** delete any memo.

Merge and Delete require confirmation. Successful management operations reload the Development page so memo cards, search/filter options, and the management panel all reflect the committed transaction.

Label colors/icons/descriptions, bulk label operations, ownership, and synchronization are not implemented yet.

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

## Search and filters

The current Development slice supports browser-local filtering within the selected lifecycle location: **Memos**, **Archive**, or **Trash**.

- **Search memos** performs a case-insensitive substring match across the memo title, memo body, and current label-name projection.
- **Color** can show all colors, memos with no color, or one exact palette color.
- **Label** can show all labels or one exact current label name. Label matching is case-insensitive.
- Search, color, and label constraints can be combined.
- **Clear search and filters** returns the current lifecycle view to its unfiltered state.

Search terms and filter selections are intentionally not saved, synchronized, or added to recent-search history in this slice. Reloading the page returns the controls to their defaults. Advanced search expressions, date/attachment/checklist/metadata search, smart filters, and saved views are not implemented yet.

## Presentation modes

The memo collection supports four browser-local presentation modes: **Comfortable**, **Compact**, **List**, and **Dense**. Choose a mode with the radio controls above the memo collection. Native radio-button keyboard behavior is retained. The selected mode is stored only in the current browser profile and survives reloads; it does not change memo records or synchronize to another browser/device.

## Archive and restore

Select **Archive** on an active memo to remove it from the main Memos view without deleting it. Open **Archive** to view archived memos. Select **Restore** to return an archived memo to **Memos**.

## Trash and recovery

Select **Move to Trash** from Memos or Archive. Open **Trash** to view trashed memos. Select **Restore** in Trash to return the memo to the location it came from. **Delete permanently** is available only in Trash and requires explicit confirmation.

## Data migration

The local memo record format and IndexedDB database are currently version 4. Version 4 introduces managed local Label identity records and a Memo–Label relation store while retaining the current label-name projection for UI/search compatibility.

When the application opens older databases:

- **v1 → v4:** memo content/lifecycle data is normalized; labels and label IDs begin empty.
- **v2 → v4:** existing pin state is preserved with deterministic initial pin order; labels and label IDs begin empty.
- **v3 → v4:** existing memo-local label names are deduplicated case-insensitively across the local library, assigned stable Label UUIDs, related to memos through Memo–Label rows, and written back with aligned `labelIds` plus canonical label-name projections. Existing memo content, timestamps, color, pin state/order, and lifecycle state are preserved.

Rename, Delete, and Merge operate inside the existing v4 schema; they do not require another database-version migration.

## Data boundary

This Development slice has no server or synchronization service. Data stored in one browser profile is not available from another browser, device, or profile. Clearing site data can remove local memos, labels, drafts, and the presentation preference. Search terms and filter selections are not persisted. Operational backup and restore are not implemented.

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

Accounts, synchronization, attachments, label colors/icons/descriptions, bulk label operations, label ownership/synchronization metadata, advanced/full-roadmap search, smart filters, saved views, checklists, reminders, import/export, backups, native clients, administration beyond the local label-management slice, and Stable release qualification are not implemented.
