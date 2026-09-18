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

- **Rename** changes the label's display name while preserving its stable identity and metadata. All affected memo label displays/search projections update together. Renaming to a name already used by another managed label is rejected; use Merge instead.
- **Save details** stores an optional label color, optional icon text, and optional description. The label color uses the same local Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, and Gray palette; the icon and description may be left blank.
- **Merge** moves every relationship from the source label to the selected target label, deduplicates memos that already had both labels, updates memo projections, removes the source label, and preserves the target label's metadata.
- **Delete** explicitly removes the label from every related memo and deletes the managed Label identity. It does **not** delete any memo.

Merge and Delete require confirmation. Successful management operations reload the Development page so memo cards, search/filter options, and the management panel all reflect the committed transaction.

Memo cards use the managed Label identity to show the current canonical label name. When a label has an icon or color, the card also shows the icon and a restrained color accent as supplementary cues. The label name remains visible and is the accessible label identity, so color is never required to understand which label is present. Label descriptions remain in **Manage labels** and are not shown on memo cards.

Ownership, authorization, and synchronization are not implemented yet.

## Apply or remove a label from multiple memos

The bulk-label controls work with managed labels that already exist in the browser.

1. In the current **Memos**, **Archive**, or **Trash** view, select the **Select** checkbox on each memo you want to change.
2. Choose a managed label from **Bulk label**.
3. Select **Apply label** to add that label to every selected memo that does not already have it, or **Remove label** to remove it from every selected memo that currently has it.
4. The page reloads after a successful bulk action and shows the resulting label state.

Bulk selection is intentionally temporary. It is cleared whenever the memo list rerenders, including when search/filter results or lifecycle location change, and it is not stored across reloads.

Each bulk label action validates the selected memo set before writing and then updates Memo–Label relationships plus memo label-name/ID projections in one IndexedDB transaction. Changed memos receive the same organization-change timestamp. Applying a label still respects the current 20-label-per-memo limit; if any selected memo would exceed that limit, the bulk apply is rejected before any selected memo is changed.

Bulk actions other than label application/removal are not implemented in this slice.

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
- **Color** can show all colors, memos with no color, or one exact memo color.
- **Label** can show all labels or one exact current label name. Label matching is case-insensitive.
- **Label color** can show memos linked to at least one managed Label with the selected Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, or Gray Label v2 color. The control uses text labels; users never need to identify a color swatch.
- Search, memo color, label name, and managed Label color constraints can be combined.
- **Clear search and filters** returns the current lifecycle view to its unfiltered state.

Managed Label color now provides one bounded metadata-aware filter dimension through stable Label identity. Label icon and description do not add search/filter dimensions. The existing Label filter remains name-based, Label color/icon may appear on memo cards as supplementary presentation, and descriptions remain management-only.

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

Managed Label records are currently schema version 2. Older managed Label v1 records are normalized to v2 with no color, icon, or description until details are saved. Rename, metadata updates, Delete, Merge, and bulk label Apply/Remove operate inside the existing IndexedDB v4 stores and do not require another database-version migration.

## Data boundary

This Development slice has no server or synchronization service. Data stored in one browser profile is not available from another browser, device, or profile. Clearing site data can remove local memos, managed-label metadata, drafts, and the presentation preference. Search terms, filter selections, and bulk memo selection are not persisted. Operational backup and restore are not implemented.

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

Accounts, synchronization, attachments, bulk actions beyond label application/removal, label ownership/authorization/synchronization metadata, managed Label icon/description search/filter dimensions, advanced/full-roadmap search, smart filters, saved views, checklists, reminders, import/export, backups, native clients, administration beyond the local label-management slice, and Stable release qualification are not implemented.
