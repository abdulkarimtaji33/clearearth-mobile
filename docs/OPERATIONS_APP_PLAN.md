# ClearEarth Mobile: Operations App Plan

**Status:** Built (all phases) · **Date:** 2026-10-22 · **Target:** `clearearth-mobile` (Expo SDK 57, RN 0.86, NativeWind 4, React Query 5)

## Decisions

| Topic | Decision |
|---|---|
| App shape | Same app, role-based. `operations_manager` signs in and gets a new **Operations** experience, the same way `driver` → Pickups and `inspection_team` → Inspections work today. |
| Scope | **Everything** the web gives operations. There is no v2. |
| Backend | **Additive changes only.** New endpoints, filters and response keys are fine. Existing behavior the web relies on stays unchanged. |
| Design | ClearEarth brand (emerald `#10B981` / teal `#06B6D4` / navy `#0A1628`) in a "command-center" style: bottom tabs, navy hero dashboard, large tap targets, one-tap actions, bottom sheets, light and dark mode. |

---

# Part 1: The full plan (spec)

## 1. Who uses it and what they need

The **Operations Manager** runs field execution. They turn approved sales orders into work orders, schedule and assign drivers and crews, track task progress and evidence, log expenses, confirm pickup dates with sales, receive goods (GRN), watch stock, and keep certificates moving. They are often away from a desk: on the yard floor, at a client site, or in a vehicle. The app has to answer three questions within a couple of seconds of opening it:

1. **What needs me right now?** Unassigned pickups, overdue tasks, pickup dates to confirm, GRNs to review, orders waiting for a work order.
2. **What's happening today?** Today's tasks, who is on the road, and what's in progress.
3. **Let me act on it.** Assign, start, complete, photograph, confirm, approve. Each of these is one or two taps and never needs a laptop.

## 2. Backend reality (verified against code, not the outdated docs)

The operations role (`operations_manager`) currently has these permissions: `deals.read`, `grn.create/read/update`, `operations.*` (`approve/create/delete/export/read/update`), `purchase_orders.read`, `quotations.read`, `users.read`, `inspection_requests.update`, `inspection_reports.read`, `hr.attendance.read`, `hr.leave.approve`.
It does **not** have `certificates.*` by default, so the Certificates module is gated on that permission (see §4.8).

Deal monetary amounts are redacted for this role on the server (`dealFinancials.js`). The app never displays money, apart from expense lines the manager enters themselves.

### Existing endpoints the app uses

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh-token`, `GET /auth/me`, `PUT /auth/change-password`, `POST /auth/logout` |
| Dashboard | `GET /dashboard/overview`: ops payload has `kpis`, `actionables`, `overdueTasks`, `driverActivity`, `recentServiceOrders`, `recentPurchaseOrders`, `todayWorkOrders` |
| Work orders | `GET /work-orders?search&status&dealId&page`, `GET /work-orders/:id`, `POST /work-orders` (needs `quotationId` XOR `purchaseOrderId`, approved, not a bill, one WO per source), `PUT /work-orders/:id` (title/notes/status + optional full `tasks[]` replace; completing needs all tasks completed and auto-creates the purchase bill and GRN), `PATCH …/tasks/:taskId/status`, `…/notes`, `…/assign` (`assigneeIds[]`), `GET/POST/DELETE …/tasks/:taskId/files` (multipart `files`, max 20), `POST …/files/:fileId/link-certificate`, `DELETE /work-orders/:id` |
| Work types | `GET/POST/PUT/DELETE /work-types` |
| People | `GET /users/drivers`, `GET /users/assignees` |
| Orders | `GET /quotations?status=approved` (service orders), `GET /quotations/:id`, `GET /quotations/:id/pdf?documentType=order`, `POST /quotations/:id/confirm-pickup-date`, `POST /quotations/:id/request-pickup-reschedule {note}`; the same set exists on `/purchase-orders` (with `side=company|supplier`, `companyId`, `supplierId`), `GET /purchase-orders/:id/pdf` |
| GRN | `GET /grn?status&search&workOrderId&dealId`, `GET /grn/:id`, `POST /grn {workOrderId, items}`, `PATCH /grn/:id {notes, status, items[]}` (status `new → submitted` notifies sales), `POST /grn/:id/items/:itemId/images` (multipart `images`), `POST /grn/:id/approve` (adds to inventory and auto-creates certificates), `GET /grn/:id/pdf`, `GET /grn/inventory` (flat item list) |
| Deals | `GET /deals`, `GET /deals/:id` (amounts redacted), `PATCH /deals/:id/collection-details`, `POST /location-share/deals/:dealId/token` (7-day client pin link) |
| Certificates | `GET /certificate-requests`, `GET /certificate-requests/:id`, `GET …/:id/task-evidence`, `POST …/:id/attachments`, `GET /certificates`, `GET /certificates/:id/pdf` |
| Leave | `GET /hr/leave/requests` (manager scope), `POST /hr/leave/requests/:id/approve`, `POST …/reject` |
| Notifications | `GET /notifications?limit&unreadOnly`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`; Socket.IO at `/socket.io` emits `notification` events per user (JWT in `auth.token`) |
| Lookups | `GET /material-types`, `GET /dropdowns/category/:category` (UoM etc.) |

### Additive backend changes (B1–B7)

| # | Change | Why |
|---|---|---|
| B1 | `PATCH /work-orders/:id/tasks/:taskId/expenses` `{ expenses: [{description, amount, evidencePath, evidenceFileName}] }`. Reuses `syncTaskExpenses`, so lines already linked to the accounting ledger stay locked. Fires `notifyExpenseSubmitted`. | Today, adding one expense means re-sending the whole WO task list through `PUT`. That is risky from a phone and could drop fields. |
| B2 | `GET /work-orders` extra filters: `overdue=true`, `assignedTo=<userId>`, `unassigned=true`, `sort=due`. Each list row also gets a computed `taskSummary {total, completed, inProgress, overdue, nextDue}`. | Lets the list cards show progress and overdue state without loading every task's detail. |
| B3 | `GET /grn/inventory/stock`: aggregated `inventory` rows (material type, total qty, UoM, last updated). | The `Inventory` table is populated on GRN approval but has no endpoint yet. Needed for the stock-on-hand screen. |
| B4 | Ops dashboard payload gains `pendingPickupConfirmations[]` (approved quotations/POs with `pickup_date_status = 'pending'`), `unassignedTasks[]` (structured, not only labels) and `counts { ordersAwaitingWo, grnsNew, grnsSubmitted }`. | Powers the "Needs you" feed and tab badges. These are new keys only, so the web ignores them. |
| B5 | `GET /quotations` and `GET /purchase-orders` gain a `hasWorkOrder=true\|false` filter and include `workOrder {id,status}` on rows. | Powers the "Ready to convert" view. |
| B6 | Push notifications: migration `user_push_tokens(user_id, tenant_id, token, platform, created_at)`; `POST /notifications/push-token` and `DELETE /notifications/push-token`; `notification.service.create` also sends an Expo push when the user has tokens (no-op otherwise). | Ops managers need to hear about GRN submissions, expense approvals and pickup reschedules while the app is closed. |
| B7 | `GET /work-orders/:id` task rows get `isOverdue`. `GET /grn/:id` is unchanged. | Small conveniences for the UI. |

Every change gets a smoke test against the local API using the operations test user.

## 3. Information architecture

```
Login (shared)
└── Operations (operations_manager)
    ├── Tab: Home            Command-center dashboard
    ├── Tab: Work            Work orders → WO detail → Task sheet
    ├── Tab: Orders          Service orders / Client POs / Vendor POs → Order detail → Create-WO wizard
    ├── Tab: Stock           GRNs (+ detail/edit/approve) | Inventory (stock on hand + received items)
    └── Tab: More            Deals · Certificates* · Team leave* · Work types · Notifications · Profile & settings
    Global: notification bell (header) · search · toast · offline banner
    (* shown only when the user has the permission)
```

Tab badges: **Work** shows the overdue task count. **Orders** shows orders awaiting a WO plus pickup dates to confirm. **Stock** shows GRNs that are `new` or `submitted`. **More** shows the unread notification dot.

## 4. Screens and features

### 4.1 Home (command center)
- **Navy gradient hero.** Greeting, date, avatar, and a bell with an unread badge. Below it, a horizontally scrollable row of 4 **KPI tiles**: WOs in progress, overdue tasks (red when above 0), GRNs pending, expenses pending. Each tile deep-links to a filtered list.
- **"Needs you" feed.** A prioritized card stack with an inline action on each card:
  - Unassigned pickup → **Assign** (opens the assignee sheet in place)
  - Pickup date to confirm → **Confirm** / **Reschedule**
  - Approved order without WO → **Create WO**
  - GRN submitted → **Review**
  - Overdue task → **Open**
- **Today timeline.** A vertical timeline of today's tasks showing time window, WO title, work type, assignee avatar and a status pill. Tapping opens the WO. The status pill cycles state (with a haptic tap).
- **On the road.** A horizontal strip of driver avatars with live status rings (not started / in progress) and current WO.
- **Recent orders.** Two compact cards, service and purchase, each showing "Convert" or "Open WO".
- Pull to refresh and skeleton loaders. Data refetches when the app returns to the foreground.

### 4.2 Work orders
- **List.** Search, a segmented filter (All / New / In progress / Completed / Cancelled), and quick chips (Overdue · Unassigned · Mine). Each card shows: WO title and deal number, a status pill, a **task progress bar** (3/5), next due date (red when overdue), an assignee avatar stack, and the source badge (SO/PO). Infinite scroll.
- **Detail.** A sticky header with the title, a status pill and a progress ring. Below it, four sections:
  - **Overview:** deal, client, pickup location (tap to open Maps), pickup contact (tap to call or WhatsApp), container and location type, inspection/WDS/certificate requirement chips, notes (editable).
  - **Tasks:** a reorderable list. Each task card has a three-state status segmented control (tap to change), work type, date window, assignee chips, notes preview, an evidence count and an expense total.
  - **Documents:** the linked GRN (opens GRN), purchase bills (number and status only) and the source order PDF.
  - **Activity:** created by and timestamps.
- **Primary action button** (changes with state): **Start work** (new → in_progress); **Complete work order**, disabled with an explanation until all tasks are done, and then a confirm sheet that explains the GRN and purchase bill will be auto-created; **Reopen** (with confirmation). An overflow menu holds Edit title/notes, Cancel WO and Delete WO (destructive, confirmed).
- **Task sheet** (full-height bottom sheet):
  - Status control and **assignees** (multi-select from `/users/assignees` with search, drivers listed first, avatars).
  - Date range pickers, work type picker (with "+ New work type"), notes (autosave on blur).
  - **Evidence:** a grid with camera, gallery and document (PDF) buttons. Uploads show progress. Long-press an item to delete it or to **Link to certificate request** (only when permitted).
  - **Expenses** (uses B1): add a line with description, amount (AED) and an evidence photo. Lines locked by accounts show a lock and their accounts status (pending / approved / rejected).
- **Add / edit / delete task** goes through `PUT /work-orders/:id` with a lossless rebuild of the full task list. Every existing field is preserved, including `id`, `assigneeIds`, expenses and evidence paths, and a dedicated serializer is unit-tested for this.

### 4.3 Orders → work order
- **Segmented tabs:** Service orders (`/quotations?status=approved`), Client POs (`/purchase-orders?status=approved&side=company`), Vendor POs (`side=supplier`).
- **Filter chips:** Needs WO · Has WO · Pickup pending · All.
- **Card:** deal title and number, client/vendor, approved date, **pickup date pill** (Requested · Confirmed · Reschedule requested), and **Create WO** or **Open WO**.
- **Detail:** header, deal summary, line items (product/service, quantity, UoM; **no prices**), the pickup date block with **Confirm** and **Request reschedule** (sheet with a note), **View PDF** (download, open, share), and **Create work order**.
- **Create-WO wizard** (3 steps, progress dots, back-safe):
  1. **Source:** a read-only summary of the order and deal. The WO title is prefilled ("{Deal title} – {SO/PO #}") and can be edited. Notes.
  2. **Tasks:** add tasks from **templates**: one tap adds "Pickup", "Transport", "Sorting", "Destruction" and so on from the tenant work types. Each task has a work type, a date window (defaulting to the confirmed or requested pickup date), assignees and notes. Tasks can be reordered and removed.
  3. **Review:** a summary of everything, then **Create work order**. On success the app shows a success state and goes to the new WO.

### 4.4 Stock: GRN and inventory
- **GRN list:** a status segment (New / Submitted / Approved / All), search by GRN or deal number. Each card shows the GRN number, deal, WO, item count, photo count and a status pill.
- **GRN detail:** header and status; deal/WO/client links; and an item list with name, material type, qty and UoM, make/model/serial, units, notes and a photo strip. When the GRN isn't approved:
  - Edit items in a sheet (add, remove, change fields; material type and UoM pickers).
  - **Add photos** per item (camera or gallery, multi-select).
  - **Submit** (new → submitted, notifies sales).
  - **Approve** (a confirm sheet lists the materials and quantities that will be added to stock).
  - **PDF** (open or share).
- **Create GRN:** available from any completed WO that has none (usually auto-created already).
- **Inventory:** a "Stock on hand" summary (B3) with cards per material type, showing large quantity numbers and the last-updated time. Below it, a "Received items" list (`/grn/inventory`) with material chips and search. Tapping an item opens its GRN.

### 4.5 Deals (read-only + collection details)
- List with search and status filter. Detail shows the deal type, client, contact (call/email), items without amounts, requirements chips, inspection report summary and linked WOs.
- **Edit collection details:** pickup location, contact name and contact number.
- **Share location link:** generates a client pin link and opens the native share sheet (WhatsApp etc.).

### 4.6 Notifications
- An inbox grouped by Today / Earlier, with an icon per type. Tapping marks a notification read and deep-links to the entity (WO, GRN, quotation, PO, deal). Includes "Mark all read".
- **Live updates:** a Socket.IO client is connected while signed in. New notifications show a toast and bump the badge. Foreground and background **push** use B6 with `expo-notifications`.

### 4.7 Profile & settings
- Avatar, name, role and tenant. Change password. Theme (System / Light / Dark). Notification preference toggle. API URL override (dev builds only, already exists). App version. Sign out.

### 4.8 Certificates (gated: `certificates.read`)
- Request list (status: pending verification / verified / generated / issued) and detail with attachments and task evidence. Ops can attach WO evidence via B-existing link-certificate. Issued certificates can be viewed or shared as PDF.
- If the operations role lacks the permission, the entry is hidden. Granting it is an admin decision in the web Roles screen; no migration forces it.

### 4.9 Team leave (gated: `hr.leave.approve`)
- Pending leave requests from the manager's team. Each shows the employee, type, dates and number of days, and has **Approve** / **Reject** (reason sheet). There is also a history tab.

### 4.10 Work types
- List, add, rename and delete (blocked with a clear message when tasks use the type).

## 5. Design system (command-center)

- **Palette:** existing tokens (`src/theme/tokens.ts`). Navy `#0A1628` for hero surfaces, emerald for primary actions, teal for info. Status colors: overdue red, today amber, upcoming blue, completed green. New semantic pills for WO, task, GRN, order-pickup and certificate statuses live in one `statusConfig` map.
- **Type scale:** 30/24/20/16/14/12. Numbers in KPI tiles use bold tabular figures.
- **Components to add (in `src/components/ui`):** `BottomSheet` (Reanimated + Gesture Handler, snap points, keyboard aware), `SegmentedControl`, `StatusPill`, `ProgressBar`, `ProgressRing`, `KpiTile`, `SectionHeader`, `ListRow`, `AvatarStack`, `Chip`/`ChipGroup`, `ConfirmSheet`, `ActionSheet`, `Fab`, `Timeline`, `StepIndicator`, `OfflineBanner`, `TabBar` (custom, with badge and haptics), `ScreenHeader` (large title that collapses on scroll), `EvidenceGrid`, `UploadProgress`.
- **Interaction rules:**
  - Tap targets are at least 48dp.
  - Primary action is in thumb reach (bottom sticky bar).
  - Every destructive action is confirmed.
  - Every mutation is optimistic where it's safe (task status, notes, read state) and rolls back with a toast on error.
  - Haptic feedback on status changes.
  - Skeletons rather than spinners for lists.
  - Every list has empty, error and offline states with a retry.
- **Accessibility:** labels on all icon buttons, dynamic type tolerance, contrast AA in both themes.
- **Motion:** `FadeInDown` list entrances (already in use), spring-based sheet, shared progress animations. Durations are 150–350 ms.

## 6. Technical architecture

- **Routing:** `src/lib/roles.ts` adds `OPERATIONS_ROLE_NAMES = ['operations_manager']` and `isOperationsRole`. `isSupportedRole` includes it, and the unsupported-role message is updated. `RootNavigator` sends that role to `OperationsNavigator` (bottom tabs, each with a native stack).
- **Permissions:** `usePermission('grn.update')` reads `user.permissions` from `/auth/me` and gates UI elements (the server stays the source of truth).
- **Data layer:** `src/api/ops/*.api.ts` (one module per area) and `src/api/ops/types.ts` mirror the backend exactly. React Query hooks live in `src/hooks/ops/*` with a query-key factory, invalidation after mutations, and `refetchOnFocus` via AppState.
- **Uploads:** a shared multipart helper (pattern from `CompletePickupForm`) that compresses images (`expo-image-manipulator`, max 1600px, q 0.7) and reports progress.
- **Files/PDF:** `expo-file-system` downloads with the bearer token, then `expo-sharing` or an in-app viewer.
- **Realtime:** `socket.io-client`, connected in an `OpsRealtimeProvider`. Events invalidate the notifications and dashboard queries.
- **Push:** `expo-notifications` registers the token after login and calls B6.
- **New dependencies** (installed with `npx expo install` for SDK-57-compatible versions): `@react-navigation/bottom-tabs`, `expo-haptics`, `expo-document-picker`, `expo-file-system`, `expo-sharing`, `expo-image-manipulator`, `expo-notifications`, `socket.io-client`.
- **Quality bar:** `tsc --noEmit` clean, `expo lint` clean, no `any` in the new API types, every network error goes through one `toUserMessage(err)` helper.

## 7. Test data and QA

- **QA account:** a dedicated `operations_manager` user, `ops.demo@clearearth.test`, in local tenant 2. The existing `operations@gmail.com` stays untouched.
- **Seed script** `clearearth-backend/scripts/seed-ops-demo.js` (idempotent, every row tagged `[OPS-DEMO]`, with a `--cleanup` flag) creates about:
  - 12 approved orders, some with and some without WOs, with pickup dates in pending, confirmed and reschedule states
  - 15 WOs across all statuses, 40+ tasks (overdue, today, upcoming; assigned and unassigned)
  - evidence files, expense lines, 8 GRNs (new, submitted, approved) and inventory
  - notifications
- **Local DB:** `clearearth_erp2` is missing the certificate tables. The project's migration (`node run-migration.js`, idempotent) is run once, deliberately, before QA.
- **QA run:**
  - Backend smoke script for every endpoint in §2 as the ops user.
  - Type check and lint.
  - Launch the app (Android emulator if available; Expo web for visual checks otherwise).
  - Walk the golden paths: approve → create WO → assign → start → evidence → expenses → complete → GRN edit → submit → approve → stock updated; confirm/reschedule pickup; notifications arrive live.
  - Driver and inspection flows still work (regression).

---

# Part 2: Phases

Each phase ends with a self-review: type check, a run of the affected flows, and a short log entry. The next phase starts right after.

### Phase 1: Backend additions and test data
- B1–B7 (routes, controllers, services, migration for `user_push_tokens`).
- Run the project migration on local DB; create the QA ops user; write and run `seed-ops-demo.js`.
- API smoke script `scripts/smoke-ops-api.js` covering the existing and new endpoints.
- **Done when:** every smoke check passes, and the web's ops dashboard/WO/GRN endpoints return the same shape as before (plus new keys).

### Phase 2: Mobile foundation
- Install dependencies. Role routing, `usePermission`, `OperationsNavigator` with the custom tab bar and badges.
- Design-system components (§5). Ops API modules and types, query hooks, upload and PDF helpers, error mapping.
- **Done when:** the ops user signs in and lands on the tab shell; driver and inspection still route correctly; `tsc` is clean.

### Phase 3: Home and notifications
- Command-center Home (hero, KPIs, Needs-you feed with inline actions, Today timeline, On the road, recent orders).
- Notifications inbox, deep links, Socket.IO realtime, badge.
- **Done when:** Home renders the seeded data, and inline Assign/Confirm actions work.

### Phase 4: Work orders
- List (filters, chips, progress, infinite scroll), detail (sections, sticky actions, status transitions with guards), task sheet (status, assignees, dates, work type, notes, evidence upload/delete/link, expenses via B1), add/edit/delete tasks with the lossless serializer (unit-tested), work types management.
- **Done when:** the full WO lifecycle runs from the phone, including completion that auto-creates the GRN.

### Phase 5: Orders and the Create-WO wizard
- Three-segment orders list with filters, order detail, pickup confirm/reschedule, PDF open/share, the three-step wizard with task templates.
- **Done when:** an approved SO and a client PO are each converted to a WO on the phone, and pickup confirmations reflect on the web.

### Phase 6: Stock (GRN and inventory)
- GRN list and detail, item editor, per-item photos, submit, approve with stock preview, PDF, create from completed WO; stock-on-hand and received-items views.
- **Done when:** a GRN goes from new to approved on the phone, and the stock totals increase.

### Phase 7: More: deals, certificates, team leave, profile, push
- Deals list/detail, collection-details edit, share-location link.
- Certificates (gated), team leave approvals (gated), profile/settings (theme, password).
- Push registration and handling (B6).
- **Done when:** every More entry works or is correctly hidden by permission.

### Phase 8: Polish, full QA and handoff
- Dark mode pass, haptics, accessibility labels, empty/error/offline states, performance (memoized rows, `FlatList` tuning), and an app icon/name check.
- Full QA (§7), including driver/inspection regression; fix everything found.
- Handoff: how to run it, QA credentials, and what remains stubbed (e.g. push needs an EAS `projectId` and FCM credentials).

## Known constraints and stubs

- **Push notifications** need an EAS project (`extra.eas.projectId`) and Android FCM credentials, which this repo doesn't have yet. The code paths are built and no-op safely until these are added. In-app realtime via Socket.IO works without them.
- **Certificates** for operations depend on an admin granting `certificates.read/create` to the role.
- **Money:** the app never shows deal or order amounts to operations, which matches the web's redaction.


## Build outcome (2026-10-22)

All eight phases were implemented. Deviations from the plan above:

- **Progress ring** was replaced by a progress bar plus an "N of M tasks done" label (no `react-native-svg` dependency).
- **Full database migration** was run on the local dev DB after a backup, because it was missing tables the code already depended on (not only the new `user_push_tokens`).
- **Release build** uses `gradlew.bat assembleRelease` with the Android SDK at `E:\Android\Sdk` (installed because none existed), arm64 only, single worker, ~1 GB heap. The default multi-ABI build exhausts memory on this machine.
- The release APK is signed with the project's debug keystore. Create a real keystore before any store release.
- **Not verified on a device or emulator.** Verification done: `tsc --noEmit`, Metro bundling (all modules resolve), serializer tests, and 24 backend API smoke checks.
