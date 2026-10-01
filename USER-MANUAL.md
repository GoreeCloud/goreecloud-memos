# GoreeCloud Memos — Development User Manual

**Applies to:** current local browser Development experience only.

## Start the application

From the repository root, run:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173/web/` in a modern browser with IndexedDB support.

## First use and navigation

On a fresh browser profile, Memos presents a short three-step setup flow covering quick capture, the local privacy boundary, and workspace controls. Setup progress is stored locally so an interrupted first-use flow can resume. After completion, the setup can be replayed from **Settings**.

The main shell keeps **Memos**, **Archive**, **Trash**, managed Labels, Quick capture, Settings, and About in the persistent workspace navigation. **Search memos** stays in the top application bar. Advanced filters, Saved Views, bulk-label controls, presentation modes, appearance, and contextual-hint preferences live in **Workspace settings** so they remain available without crowding the primary capture surface.

Keyboard shortcuts available outside text-entry fields and modal setup are:

- **N** — open Quick capture in Memos.
- **/** — focus Search memos.
- **Escape** — close an open action surface or inline memo editor and return focus to the relevant trigger/card when applicable.

Contextual hints can be disabled and re-enabled from Settings.

## Capture a memo

1. Optionally enter a title.
2. Optionally choose a memo color from the visual swatches.
3. Optionally choose existing managed labels from the suggested chips or type a new label and press **Enter**.
4. Enter memo content.
5. Select **Save memo**.
6. The memo is stored in that browser's local IndexedDB database and appears in **Memos**.

Text and organization fields entered into the composer are preserved locally as a draft while typing. Reloading the page restores the draft. A successfully saved memo clears the composer draft.

The composer presents labels as removable chips with managed-label suggestions instead of exposing the underlying comma-separated storage field. Typing a new label and committing it adds a chip immediately. Internally, the Development slice maps those names to managed local Label identities with stable UUIDs and Memo–Label relationships. Names are trimmed and duplicate input is removed case-insensitively. Existing managed identity is reused for the same normalized name.

## Manage labels

The **Manage labels** panel works only with managed labels already created by memo capture or editing.

- **Rename** changes the label's display name while preserving its stable identity and metadata. All affected memo label displays/search projections update together. Renaming to a name already used by another managed label is rejected; use Merge instead.
- **Save details** stores an optional label color, optional icon text, and optional description. The label color uses the same local Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, and Gray palette; the icon and description may be left blank.
- **Merge** moves every relationship from the source label to the selected target label, deduplicates memos that already had both labels, updates memo projections, removes the source label, and preserves the target label's metadata.
- **Delete** explicitly removes the label from every related memo and deletes the managed Label identity. It does **not** delete any memo.

Merge and Delete require confirmation. Successful management operations refresh the affected memo/label workspace in place after the committed transaction. The page is not reloaded, so the current application context remains available while cards, counts, filters, and label controls reconcile to the persisted state.

Memo cards use the managed Label identity to show the current canonical label name. When a label has an icon or color, the card also shows the icon and a restrained color accent as supplementary cues. The label name remains visible and is the accessible label identity, so color is never required to understand which label is present. Label descriptions remain in **Manage labels** and are not shown on memo cards.

Ownership, authorization, and synchronization are not implemented yet.

## Work with multiple selected memos

Selection is browser-local and temporary. In **Memos**, **Archive**, or **Trash**, use each memo's **Select** checkbox, then open **Workspace settings** to act on the current selection.

- **Copy selected** and **Export selected** produce local plain text without changing memo state.
- **Apply label** and **Remove label** operate on an existing managed label.
- In **Memos**, **Archive selected** moves every selected active memo into Archive.
- In **Memos** or **Archive**, **Move to Trash** moves every selected memo into recoverable Trash.
- In **Archive** or **Trash**, **Restore selected** restores each selected memo. A memo restored from Trash returns to the lifecycle location it came from, so an archived memo returns to Archive rather than being silently promoted to Memos.

After a successful mutating bulk action, Memos refreshes the affected workspace in place and clears the selection. Selection is also cleared whenever the memo list rerenders, including when search/filter results or lifecycle location change, and it is not stored across reloads.

Bulk label and lifecycle mutations validate the selected memo set before writing and use one IndexedDB transaction for the operation. If any selected memo cannot perform the requested transition, the operation is rejected before any selected memo is changed. Applying a label still respects the current 20-label-per-memo limit.

There is no bulk permanent-delete action. **Delete permanently** remains a single-memo Trash-only destructive action with explicit confirmation.

## Edit a memo

1. In **Memos**, click or keyboard-activate the memo card to open its inline editor directly.
2. Change the title or memo content, choose a color swatch, and add or remove label chips as needed.
3. Changes save automatically after a short pause in typing.
4. Wait for **Saved.** when you need confirmation that the most recent edit was written locally.
5. Select **Done** or press **Escape** to close the inline editor. The three-dot action menu remains reserved for secondary lifecycle and pinning actions.

Memo content cannot be saved as blank.

## Pin and reorder memos

Open an active memo's action menu and select **Pin** to place it before ordinary memos. Pinned memos retain a stored manual order.

Use **Move pin up** and **Move pin down** in the card action menu to change that order. The controls are disabled when a pinned memo is already at the corresponding boundary. Select **Unpin** to return the memo to ordinary update-time ordering.

Pin state and manual pin order persist across reloads in the same browser profile.

## Memo colors

The current local palette includes Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, and Gray. A memo can also have no color.

Color is stored as memo metadata. The card uses a restrained visual treatment plus an accessible named color indicator; the visible metadata stays compact while assistive technology receives the color name, so color is not the sole carrier of meaning.

## Search and filters

The current Development experience supports browser-local filtering within the selected lifecycle location: **Memos**, **Archive**, or **Trash**. Search is always available in the top bar; direct filter controls live in **Workspace settings**.

- **Search memos** performs a case-insensitive substring match across the memo title, memo body, and current label-name projection. The same box also recognizes bounded field expressions: `color:<memo-color>`, `label:<exact-name>`, and `label-color:<managed-label-color>`. Use quotes for label names containing spaces, for example `label:"Project Work"`.
- **Color** can show all colors, memos with no color, or one exact memo color.
- **Label** can show all labels or one exact current label name. Label matching is case-insensitive.
- **Label color** can show memos linked to at least one managed Label with the selected Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, or Gray Label v2 color. The control uses text labels; users never need to identify a color swatch.
- Plain text, expression fields, memo color, label name, and managed Label color constraints can be combined. All active constraints use AND semantics.
- **Clear search and filters** returns the current lifecycle view to its unfiltered state.

Managed Label color now provides one bounded metadata-aware filter dimension through stable Label identity. The advanced-expression slice exposes only already verified local dimensions: memo color, exact label name, and managed Label color. Supported memo colors are Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, Gray, plus `color:none`; managed Label color expressions use the nine palette colors. A recognized field with no value, an unsupported color, a duplicate recognized field, or an unterminated quote produces an explicit search-expression error instead of silently changing meaning. Unknown colon-containing text such as a URL remains ordinary text search. Label icon and description do not add search/filter dimensions. Label color/icon may appear on memo cards as supplementary presentation, and descriptions remain management-only.

Search terms and active filter selections are not persisted automatically. Live typing remains ephemeral. To keep a query in **Recent searches**, press **Enter** in Search memos; Memos stores up to eight valid submitted queries in the current browser profile. Selecting a recent query reapplies it and moves it to the front. **Clear recent searches** removes only that local history; it does not clear the active query, filters, Saved Views, or memo data. Reloading the page still returns the active controls to their defaults unless you explicitly apply a Saved View.

## Saved views

Saved views let you explicitly preserve the current search/filter state in this browser.

1. Set **Search memos**, **Color**, **Label**, and **Label color** to the combination you want.
2. Enter a unique **New view name**.
3. Select **Save current view**.
4. After a reload, choose that name from **Saved view** and select **Apply saved view** to restore the saved search/direct-filter controls in the current Memos, Archive, or Trash location.
5. Select **Delete saved view** and confirm to remove only that Saved View. Memos are not deleted.

Saved View names are unique case-insensitively. A Saved View stores the raw Search memos value plus the direct memo-color, label-name, and managed Label-color selections. The search expression must be valid before it can be saved. Saved Views do **not** store the current lifecycle location, presentation mode, ordering, pinning, icon/color decoration, or a default-view setting, and they do not synchronize to another browser or device. If a Saved View requires an exact label that is not available in the current lifecycle location, applying it fails explicitly rather than silently removing that filter.

Advanced expression fields beyond the three documented local dimensions, date/attachment/checklist/other metadata search, smart filters, synchronized Saved Views, saved-view ordering/pinning/styling/default behavior, synchronized recent-search history, and search-history portability are not implemented yet.

## Presentation and appearance

The memo collection supports four browser-local presentation modes: **Comfortable**, **Compact**, **List**, and **Dense**. Choose a mode in **Workspace settings**. Native radio-button keyboard behavior is retained. The selected mode is stored only in the current browser profile and survives reloads; it does not change memo records or synchronize to another browser/device.

Appearance is also browser-local and offers **System**, **Light**, **Dark**, and **Deep Dark**. Accessibility media preferences such as Reduced Motion, Increased Contrast, Reduced Transparency, and Forced Colors are respected by the shell where the browser exposes them.

## Archive and restore

Open an active memo's action menu and select **Archive** to remove it from the main Memos view without deleting it. Open **Archive** to view archived memos, then use a card's action menu to **Restore** it to **Memos**. For multiple active memos, select them and use **Archive selected**; multiple archived memos can be restored together with **Restore selected**.

## Trash and recovery

Use **Move to Trash** from a memo card's action menu in Memos or Archive, or select multiple memos and use **Move to Trash**. Open **Trash** to view trashed memos. Use **Restore** on one memo or **Restore selected** for the current selection to return each memo to the location it came from. **Delete permanently** is available only for an individual memo in Trash and requires explicit confirmation.

## Data migration

The local Memo record format remains schema version 4, managed Label records remain schema version 2, Saved Views use schema version 1, and the browser IndexedDB database is version 5. Database v5 adds the `savedViews` store while preserving the existing Memo/Label stores and relationships.

When the application opens older databases:

- **v1 → v5:** memo content/lifecycle data is normalized; labels and label IDs begin empty; managed-label and Saved View stores are established.
- **v2 → v5:** existing pin state is preserved with deterministic initial pin order; labels and label IDs begin empty; managed-label and Saved View stores are established.
- **v3 → v5:** existing memo-local label names are deduplicated case-insensitively across the local library, assigned stable Label UUIDs, related to memos through Memo–Label rows, and written back with aligned `labelIds` plus canonical label-name projections. Existing memo content, timestamps, color, pin state/order, and lifecycle state are preserved; the Saved View store begins empty.
- **v4 → v5:** existing Memo v4 records, Label v2 identities/metadata, and Memo–Label relations are preserved as-is; only the new empty `savedViews` store and its unique case-insensitive name index are added.

Managed Label records remain schema version 2. Older managed Label v1 records are normalized to v2 with no color, icon, or description until details are saved. Rename, metadata updates, Delete, Merge, and bulk label Apply/Remove continue to use the existing Memo/Label stores. Saved View records use schema version 1 in the v5 `savedViews` store.

## Large libraries and long memos

When more than 200 memos match the current lifecycle/search state, Memos materializes the board progressively in 200-card batches. The result/status count continues to reflect the complete matching set, while **Show more** exposes additional cards without eagerly building every off-screen editor/action control. Long memo bodies use **Show more** / **Show less** previews so one memo does not dominate a board column.

## Data boundary

This Development experience has no server or synchronization service. Data stored in one browser profile is not available from another browser, device, or profile. Clearing site data can remove local memos, managed-label metadata, Saved Views, drafts, presentation/appearance preferences, onboarding state, and contextual-hint preferences. Active search terms, active filter selections, and bulk memo selection are not persisted automatically. Explicitly created Saved Views preserve filter-state snapshots, and only explicitly submitted valid searches can enter the bounded browser-local Recent searches list. Operational backup and restore are not implemented.

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

Accounts, synchronization, attachments, bulk permanent deletion and broader bulk operations beyond the current label/lifecycle actions, label ownership/authorization/synchronization metadata, managed Label icon/description search/filter dimensions, advanced expression fields beyond the current bounded local dimensions, full-roadmap search, smart filters, Saved View synchronization/order/pin/icon/color/default-view behavior beyond named local filter snapshots, checklists, reminders, format-versioned import/export round trips, backups, a native desktop client, connected/synchronized Android behavior beyond the current local Development foundation, administration beyond the local label-management slice, and Stable release qualification are not implemented.
