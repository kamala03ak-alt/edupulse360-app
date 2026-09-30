# EduPulse 360 — Implementation Blueprint

> **Purpose:** Architecture and delivery blueprint for a coding AI. This document preserves the EduPulse 360 product concept and terminology while intentionally excluding application code, SQL, deployment execution, and database creation.

## 1. Product Intent and Guiding Model

EduPulse 360 is an **action-first business operations and training intelligence platform** combining CRM, training/LMS operations, finance, profitability intelligence, lifecycle visibility, batch health, money trail, management reporting, and a read-only AI assistant.

The product should not feel like separate CRM, ERP, LMS, and dashboard screens. Its central operating loop is:

> **DATA → INSIGHT → ACTION → FOLLOW-UP → RESULT**

Every major record and dashboard should help users answer:

1. What happened?
2. What is happening now?
3. What is at risk or overdue?
4. What action is required next?
5. Who owns that action?
6. Did the action produce a result?

### Architecture principles

- GitHub is the single source of truth for application code and version history.
- One Supabase project/database is the system of record.
- Business rules are centralized in server/domain services rather than duplicated in UI components.
- Role-based permissions are enforced server-side and reinforced by Supabase RLS.
- Financial calculations are deterministic, auditable, and reproducible.
- UI controls cannot bypass business rules.
- The EduPulse Assistant is strictly read-only.
- Modules communicate through stable domain services and events rather than hidden cross-module mutations.
- The interface is mobile-first and responsive.
- The hackathon implementation should favor a coherent end-to-end path over excessive breadth.

---

## 2. System Architecture

### 2.1 Logical architecture

```text
Browser / Mobile-first Web UI
        |
        | HTTPS, authenticated session
        v
Next.js Application
  - Route-level pages and layouts
  - Server Components for read-heavy views
  - Client Components for interaction
  - Route Handlers / Server Actions as controlled write boundaries
        |
        v
Application Server Layer
  - Authentication/session resolution
  - Permission checks
  - Input validation
  - Domain services
  - Deterministic calculations
  - Action generation
  - Audit/event recording
        |
        +----------------------+
        |                      |
        v                      v
Supabase PostgreSQL       Gemini API
  - Relational data       - Read-only question answering
  - Constraints           - Receives approved, minimized context
  - RLS                   - Never receives credentials or unrestricted DB access
  - Auth integration
  - Storage if required
        |
        v
Vercel deployment
  - Next.js runtime
  - Environment variables
  - Preview deployments from GitHub
  - Production deployment from protected branch
```

### 2.2 Browser layer

The browser is responsible for presentation and user interaction, not authority. It may:

- Render lists, details, timelines, dashboards, forms, filters, and status indicators.
- Maintain temporary UI state such as open panels, selected filters, pagination, and optimistic visual feedback where safe.
- Perform non-sensitive presentation formatting and basic immediate validation.
- Request data through server-controlled interfaces.

The browser must not be trusted to:

- Decide whether a user has a permission.
- Calculate authoritative invoice balances or profit.
- Change record ownership without server authorization.
- Call Gemini with a raw API key.
- Write directly to Supabase in a way that bypasses domain rules.

### 2.3 Next.js application layer

Use Next.js + React + TypeScript + Tailwind CSS. A practical division is:

- **Server Components:** initial page data, management dashboards, read-only detail views, lifecycle timelines, and assistant result pages where interactivity is limited.
- **Client Components:** form controls, filters, modals, inline status changes, charts with interaction, attendance marking, and action completion UI.
- **Server Actions or Route Handlers:** mutations and controlled reads that require authorization, validation, calculations, transactions, or external API calls.
- **Shared domain services:** reusable business operations called by multiple pages and endpoints.

The server layer should resolve the authenticated user, load the internal profile and role, check permissions, validate the operation, execute the domain service, and return a safe response.

### 2.4 Supabase layer

Supabase PostgreSQL is the single source of truth for operational, financial, training, and audit data. Supabase Auth manages identity and sessions. RLS provides a database-level defense-in-depth boundary.

Recommended principles:

- Keep identity in Supabase Auth and application profile/role data in an internal profile model.
- Use foreign keys and constrained status values to protect consistency.
- Keep financial source records immutable or tightly controlled after approval.
- Prefer append-only payment and audit records where practical.
- Derive summaries from source records or controlled snapshot tables; do not allow arbitrary UI-written totals.
- Make tenant/scoping fields available if the product may later support multiple organizations, even if the hackathon uses one organization.

### 2.5 Gemini integration

Gemini is an assistant layer, not a business authority. The server should:

1. Authenticate the user and verify assistant access.
2. Interpret or classify the question within an allowed read-only question set.
3. Query only the minimum authorized records.
4. Replace sensitive fields with safer summaries where possible.
5. Provide structured facts and definitions to Gemini.
6. Instruct Gemini to answer only from the supplied context.
7. Display the answer with source records, timestamps, and a disclaimer when data is incomplete.

Gemini must never have direct unrestricted database credentials, write access, permission-management capability, or transaction capability. If the model is unavailable, the application should still provide deterministic filters and saved operational views.

### 2.6 Deployment architecture

- GitHub repository contains the Next.js application, configuration, migrations when later created, tests, and documentation.
- Vercel hosts preview and production deployments.
- Supabase hosts Auth and PostgreSQL.
- Gemini API is called only from trusted server execution.
- Secrets are stored in Vercel/Supabase environment configuration, never committed to GitHub or exposed to browser bundles.
- Protected production branch and pull-request review should be used even for a hackathon where feasible.

---

## 3. Module Architecture

### 3.1 Shared platform foundation

Responsibilities:

- Authentication and session handling.
- User profiles, roles, organization scope, and active status.
- Permission evaluation.
- Shared layout, navigation, responsive shell, notifications, loading states, and error handling.
- Audit logging and activity feed.
- Shared entity identifiers, pagination, search, filtering, and date/currency formatting.

### 3.2 CRM module

Core capabilities:

- Lead intake and source tracking.
- Pipeline stage management.
- Assignment to Sales or another permitted owner.
- Lead activities and follow-ups.
- Conversion into a customer without losing lead history.
- Lead-to-customer conversion metrics.

Interactions:

- Creates lifecycle events.
- Generates overdue follow-up actions.
- Feeds Command Center metrics.
- Supplies customer context to quotations and the Assistant.

### 3.3 Training/LMS module

Core capabilities:

- Course catalog and course metadata.
- Batch scheduling, capacity, trainer assignment, and status.
- Student records and enrolments.
- Attendance capture and attendance summaries.
- Batch operational health.
- Completion and outcome tracking.

Interactions:

- Receives customers/students from CRM.
- Connects enrolments to financial records.
- Feeds attendance, capacity, trainer, and payment signals into Batch Health.
- Generates low-attendance, low-enrolment, and capacity actions.

### 3.4 Finance module

Core capabilities:

- Quotations and approval state.
- Invoices and invoice lines.
- Payments and allocation to invoices.
- Outstanding and collection views.
- Expenses and cost categorization.
- GST-ready fields and financial summaries.

Interactions:

- Quote follows customer context.
- Invoice can originate from an approved quote.
- Payments reduce outstanding balances through deterministic allocation.
- Expenses and trainer costs feed Profitability.
- Unpaid and overdue records feed the Action Engine and Money Trail.

### 3.5 Profitability module

Core capabilities:

- Revenue recognition basis defined by the product (for MVP, invoice or collected payment basis must be selected explicitly).
- Direct trainer cost.
- Other batch/customer costs.
- Gross profit and margin.
- Batch profitability and, where enough attribution exists, customer profitability.
- Explainable calculation breakdown.

This module should never accept a manually typed “profit” as authoritative. It should calculate profit from source records and show the inputs used.

### 3.6 Action Engine

The Action Engine converts operational conditions into owned, trackable work. It should support:

- Action type and source condition.
- Priority.
- Title and actionable description.
- Related entity and deep link.
- Owner.
- Status such as open, in progress, completed, dismissed, or snoozed.
- Due date, creation time, completion time, and completion note.
- Deduplication key so repeated scans do not create endless duplicates.

The engine may be invoked after relevant mutations and/or by a controlled reconciliation job. The source condition should remain explainable.

### 3.7 Lifecycle 360

Lifecycle 360 is a cross-module timeline, not a second source of truth. It presents events from:

> Enquiry → Follow-up → Customer → Quote → Invoice → Payment → Enrolment → Training → Attendance → Completion → Outcome

Each event should show timestamp, actor/system source, related record, status, and next required action when applicable.

### 3.8 Batch Health

Batch Health combines operational signals into an explainable status. It should show:

- Enrolment count versus capacity.
- Attendance trend and exceptions.
- Trainer assignment/status.
- Payment completion/outstanding exposure.
- Revenue, costs, profit, and margin where available.
- Open operational actions.

The screen must show the contributing factors, not only a score. A simple weighted score is acceptable for the MVP if weights and thresholds are documented and visible.

### 3.9 Money Trail

Money Trail links financial and operational records for a selected customer or batch:

> Quote → Invoice → Payment → Outstanding → Expense/cost → Revenue → Profit

It should distinguish source records from derived summaries and show missing links explicitly, for example “invoice exists, no payment recorded.”

### 3.10 Command Center

The Command Center is the management operating view. It should prioritize:

- Business health summary.
- Revenue and outstanding amounts.
- Active leads and overdue follow-ups.
- Batch health distribution.
- Profitability exceptions.
- High-priority actions.
- Recent activity.
- Optional trends with clear period definitions.

Each KPI should link to the filtered underlying records. A dashboard tile without drill-down is lower priority than an actionable tile.

### 3.11 EduPulse Assistant

The Assistant provides read-only natural-language access to authorized operational facts. Initial scope should favor deterministic questions:

- Overdue follow-ups.
- At-risk batches.
- Unpaid invoices.
- Most profitable batches.
- Customers with outstanding payments.
- Actions requiring attention today.

Answers should include concise reasoning, relevant records, dates, and a link to the underlying module view. The Assistant should say when the data is incomplete or the question is outside supported scope.

---

## 4. Database Domain Model

No SQL is specified here. The following entities are the recommended domain model. Primary keys should use stable generated identifiers. All operational entities should have created/updated timestamps; mutable entities should also capture created_by/updated_by where useful.

### 4.1 Organization and identity entities

| Entity | Purpose | Important fields | Relationships and status/audit considerations |
|---|---|---|---|
| organizations | Organization boundary and future tenant scope | name, legal/business details, timezone, currency, active status | Parent of users and business records; created/updated audit |
| user_profiles | Application identity linked to Supabase Auth | auth_user_id, organization_id, display name, email snapshot, role, active status | One Auth user to one profile; role is server-controlled; audit role changes |
| permission_overrides (optional) | Explicit exceptions if role-only permissions are insufficient | user_id, permission, allow/deny, reason, active period | Must not weaken Admin/security boundaries accidentally; audited |

### 4.2 CRM entities

| Entity | Purpose | Important fields | Relationships and status/audit considerations |
|---|---|---|---|
| leads | Prospective customer record | name, contact details, source, stage, owner_id, score/priority, next_follow_up_at, notes | Belongs to organization; owner references user; statuses such as new, contacted, qualified, lost, converted; audit conversion |
| lead_activities | Calls, messages, meetings, notes, and follow-up history | lead_id, activity_type, activity_at, outcome, next_follow_up_at, owner_id, notes | Append-oriented history; actor and timestamps required |
| customers | Converted or directly created customer | name, contact details, customer_type, source_lead_id, lifecycle_status, owner_id | May originate from one lead; links to quotations, invoices, enrolments; conversion metadata |
| customer_contacts (optional) | Multiple contacts for an organization/customer | customer_id, name, role, contact details, primary flag | Useful if customers can be businesses or families |

### 4.3 Training entities

| Entity | Purpose | Important fields | Relationships and status/audit considerations |
|---|---|---|---|
| courses | Reusable course definition | name, code, description, duration, fee defaults, active status | Parent of batches; versioning may be needed later |
| trainers | Trainer profile and cost information | profile/user link, specialization, cost type, cost rate, active status | Sensitive cost fields require Finance/Manager/Admin controls |
| batches | Scheduled delivery instance | course_id, name/code, start/end dates, capacity, status, trainer_id, schedule/location/online info | Status such as planned, open, running, completed, cancelled; feeds health |
| students | Student-specific profile | customer_id optional, name/contact/identity fields, status | A student may be linked to a customer; privacy-sensitive fields |
| enrolments | Student participation in a batch | student_id, batch_id, enrolment_date, fee, discount, status, payment reference | Unique student/batch relationship; statuses such as pending, active, completed, withdrawn |
| attendance_sessions | A class/session occurrence | batch_id, session_date, topic, trainer_id, status | Parent of attendance records |
| attendance_records | Student attendance per session | session_id, student_id, attendance_status, marked_at, marked_by, note | Unique session/student; correction requires audit |
| student_outcomes | Completion and result information | student_id, batch_id, completion_status, outcome_type, outcome_date, notes | Sensitive and role-limited; lifecycle event source |

### 4.4 Finance entities

| Entity | Purpose | Important fields | Relationships and status/audit considerations |
|---|---|---|---|
| quotations | Proposed commercial agreement | customer_id, quote_number, issue_date, expiry_date, subtotal, tax, total, status, approved_by, approved_at | Links to quote lines; statuses draft, sent, approved, rejected, expired, converted |
| quotation_lines | Itemized quote content | quotation_id, course/batch reference optional, description, quantity, unit_price, tax rate | Amounts are derived deterministically; preserve snapshots |
| invoices | Amount due to customer | customer_id, quotation_id optional, invoice_number, issue/due dates, subtotal, tax, total, status | Status draft, issued, partially paid, paid, overdue, cancelled; immutable after issue except controlled corrections |
| invoice_lines | Itemized invoice content | invoice_id, description, quantity, unit price, tax rate, service/batch reference | Preserve commercial snapshot |
| payments | Money received | customer_id, payment_date, amount, method, reference, status, notes | Prefer append-only; allocation handled separately; sensitive access |
| payment_allocations | Link payments to invoices | payment_id, invoice_id, allocated_amount, allocation_date | Prevent over-allocation; supports partial and multi-invoice payments |
| expenses | Costs incurred | organization_id, expense_date, category, amount, tax fields, batch_id/customer_id optional, vendor, status, approved_by | Sensitive; statuses draft, submitted, approved, rejected |
| trainer_cost_entries (optional) | Explicit trainer cost attribution | trainer_id, batch_id, basis, amount/rate, period, approval status | Can be derived from trainer rate and sessions but explicit entries improve auditability |
| financial_periods (optional) | Reporting period controls | period_start/end, lock status, closed_by | Useful if finance reports need period locking |

### 4.5 Cross-cutting operational entities

| Entity | Purpose | Important fields | Relationships and status/audit considerations |
|---|---|---|---|
| actions | Action Engine work item | type, priority, source, title, description, related_entity_type/id, owner_id, status, due_at, completed_at, completion_note, deduplication_key | Must be explainable and auditable; support snooze/dismiss rules |
| lifecycle_events | Timeline projection/source of cross-module events | subject_type/id, event_type, occurred_at, actor_id, source_module, summary, metadata | Prefer append-only; sensitive metadata should be minimized |
| audit_logs | Security and business audit trail | actor_id, action, entity type/id, before/after summary, timestamp, request context | Do not store unnecessary secrets or full sensitive payloads |
| activity_events | Recent operational activity feed | module, event_type, entity reference, actor/system, summary, timestamp | May be a user-facing projection separate from security audit logs |
| batch_health_snapshots (optional) | Historical health reporting | batch_id, calculated_at, status, score, factor summary | Derived snapshot; source rules must remain reproducible |
| assistant_queries (optional) | Assistant observability and abuse review | user_id, question category, timestamp, response status, source references | Do not store sensitive prompts unnecessarily; never store API keys |

### 4.6 Common field conventions

- IDs: stable opaque identifiers.
- Dates: store unambiguous timestamps; display in organization/user timezone.
- Money: store exact numeric monetary values with explicit currency; avoid floating-point semantics.
- Statuses: use controlled enumerations or constrained values documented centrally.
- Soft deletion: prefer inactive/cancelled/archived states for financial and audit-relevant records; hard deletion should be rare.
- Ownership: record both business owner and actor where they differ.
- Source snapshots: preserve prices, tax rates, and descriptions on quote/invoice lines so later catalog changes do not rewrite history.

---

## 5. Role and Permission Model

Legend: **V** = view, **C** = create, **E** = edit, **D** = delete/archive, **A** = approve, **F** = sensitive financial access. A dash means no default permission. Server-side checks and RLS must enforce the matrix.

| Module | Admin | Manager | Sales | Trainer | Finance | Student |
|---|---|---|---|---|---|---|
| Users and roles | V/C/E/D/A/F | V; limited E | — | — | — | — |
| CRM leads | V/C/E/D | V/C/E/D/A | V/C/E; own/assigned by policy | V limited | V limited | — |
| Lead follow-ups | V/C/E/D | V/C/E/D/A | V/C/E; own/assigned | V limited | V limited | — |
| Customers | V/C/E/D | V/C/E/D/A | V/C/E; assigned scope | V limited for linked students | V; financial-linked fields per policy | V own profile only |
| Courses | V/C/E/D/A | V/C/E/D/A | V | V | V | V published only |
| Batches | V/C/E/D/A | V/C/E/D/A | V; operationally relevant | V/E for assigned batch operations | V; finance fields | V enrolled batch only |
| Trainers | V/C/E/D/A/F | V/E/A; cost visibility by policy | V basic | V own profile | V/C/E/D/A/F | — |
| Students | V/C/E/D | V/C/E/D | V for assigned/customer context | V/E for assigned batch students | V limited | V own profile |
| Enrolments | V/C/E/D/A | V/C/E/D/A | V/C/E within sales workflow | V limited | V for billing state | V own enrolments |
| Attendance | V/C/E/D/A | V/C/E/D/A | V summary | V/C/E for assigned batch | V summary | V own attendance |
| Quotations | V/C/E/D/A/F | V/C/E/D/A/F | V/C/E; submit for approval | — | V/C/E/D/A/F | V own issued quote where applicable |
| Invoices | V/C/E/D/A/F | V/A/F; limited edit | V view assigned customer status | — | V/C/E/D/A/F | V own invoices |
| Payments/collections | V/A/F | V/A/F | V collection status, no sensitive detail by default | — | V/C/E/D/A/F | V own payment status |
| Expenses | V/C/E/D/A/F | V/C/E/D/A/F | — | Submit own/assigned cost evidence | V/C/E/D/A/F | — |
| Profitability | V/F | V/F | Summary only | Own batch summary as permitted | V/F | — |
| Actions | V/C/E/D/A | V/C/E/D/A | V/C/E own/assigned | V/C/E assigned operational | V/C/E finance-related assigned | V own assigned student actions if any |
| Lifecycle 360 | V | V | V assigned scope | V linked training scope | V financial scope | V own lifecycle |
| Batch Health | V | V/A | V summary | V assigned batches | V finance factors | V enrolled batch summary |
| Money Trail | V/F | V/F | V limited customer trail | V limited batch summary | V/F | V own financial trail |
| Command Center | V/F | V/F | Personal/team view | Assigned-batch view | Finance view | Student dashboard |
| Assistant | V within authorized scope | V within authorized scope | V assigned scope | V assigned training scope | V authorized financial scope | V own data only |

### Permission rules

- **Admin** manages roles and security configuration; access should still be logged.
- **Manager** has broad operational oversight but should not automatically gain unrestricted user/security administration.
- **Sales** operates leads, follow-ups, customer context, and commercial workflow without unrestricted finance access.
- **Trainer** manages assigned training operations and attendance, not customer-wide finance or permissions.
- **Finance** owns financial records and sensitive calculations; access to operational context is read-oriented unless needed.
- **Student** is restricted to self-service data and any explicitly assigned actions.
- Record ownership and organization scope further restrict the role. A role grants maximum scope, not automatic access to every record.

---

## 6. Core Data Flows

### 6.1 Lead → Customer

1. Lead is created with source, owner, stage, and contact data.
2. Sales records activities and follow-up commitments.
3. On qualification, a controlled conversion operation validates required customer fields.
4. The server creates or links a customer, preserves the originating lead, and marks the lead converted.
5. A lifecycle event and activity event are recorded.
6. Existing open follow-up actions are closed, reassigned, or transformed according to policy.
7. Duplicate customer detection should warn before creating a new record.

### 6.2 Customer → Quote

1. User with commercial permission selects customer and relevant course/batch context.
2. Quote lines are entered or selected from defaults.
3. Server validates prices, discounts, tax fields, and authorization.
4. Quote total is calculated deterministically.
5. Draft quote may be edited; approval/sending creates an auditable state transition.
6. Lifecycle event is added.

### 6.3 Quote → Invoice

1. Only an eligible quote can be converted.
2. Commercial values are copied as invoice snapshots; later catalog changes do not alter the invoice.
3. Invoice number and due date are assigned server-side.
4. Invoice status becomes issued only after required approval rules pass.
5. A lifecycle event and possible collection action are created.

### 6.4 Invoice → Payment

1. Finance records a payment with method, reference, date, and amount.
2. Server validates amount and permissions.
3. Payment is allocated to one or more invoices without exceeding payment or invoice balances.
4. Invoice status is derived as unpaid, partially paid, paid, overdue, or cancelled.
5. Outstanding balance and collection actions are recalculated.
6. Audit and lifecycle events are recorded.

### 6.5 Customer → Enrolment

1. Eligible customer/student is selected.
2. Batch capacity, dates, status, duplicate enrolment, and payment policy are validated.
3. Enrolment is created with fee/discount snapshot and status.
4. Batch counts, capacity signals, lifecycle events, and any payment-related action are updated.

### 6.6 Enrolment → Batch

The enrolment belongs to one batch and contributes to:

- Active enrolment count.
- Capacity utilization.
- Attendance roster.
- Batch revenue attribution.
- Batch health.
- Student lifecycle.

Batch status changes must account for enrolled students and should not silently invalidate historical attendance or financial data.

### 6.7 Batch → Attendance

1. A session is created or inferred from the batch schedule.
2. Authorized trainer or manager records attendance for enrolled students.
3. Corrections are audited.
4. Attendance summaries are recalculated.
5. Low attendance signals may create or update actions.

### 6.8 Batch → Profitability

1. Revenue attribution is determined from invoice/payment/enrolment policy.
2. Direct trainer cost and approved expenses are associated with the batch.
3. Profit and margin are calculated deterministically.
4. Missing or provisional costs are labeled.
5. Profitability exceptions can create actions and feed Command Center/Batch Health.

### 6.9 Operational event → Action Engine

A relevant mutation or reconciliation process evaluates conditions such as overdue follow-up, overdue invoice, low attendance, low enrolment, capacity issue, at-risk status, or profitability issue. It creates, updates, resolves, or deduplicates actions. Every generated action stores its source condition and related record.

### 6.10 Database data → Assistant

The server translates the user question into an allowed query intent, applies user scope, retrieves only needed records, computes deterministic summaries, and sends a bounded factual context to Gemini. The answer returns with source links or record references. No model output directly changes database state.

---

## 7. Deterministic Business Logic

### 7.1 Lead conversion

- A lead may convert only once.
- Required customer identity/contact fields must be present.
- Duplicate detection should compare normalized contact identifiers and show a merge/link decision.
- Conversion preserves lead activities and source attribution.
- Converted leads are not hard-deleted.
- Conversion actor and timestamp are audited.
- Any open follow-up must receive an explicit post-conversion outcome.

### 7.2 Payment and outstanding

- Invoice total = approved invoice line amounts plus applicable tax/charges minus authorized discounts, using exact monetary arithmetic.
- Outstanding = invoice total minus valid allocated payments minus authorized credits/adjustments.
- Outstanding cannot be negative; excess payment requires explicit unapplied-credit or exception handling.
- Payment allocations cannot exceed payment amount or invoice outstanding amount.
- Paid status requires zero outstanding under the configured rounding policy.
- Overdue requires outstanding greater than zero and current date after due date, excluding cancelled invoices.
- Payment edits/cancellations require elevated permission and audit history.

### 7.3 Profitability

Define the basis before implementation. A practical MVP basis is:

- Revenue = selected recognized revenue source for the reporting period.
- Direct costs = trainer cost plus approved costs explicitly attributed to the batch/customer.
- Profit = revenue minus direct costs.
- Margin = profit divided by revenue when revenue is positive; otherwise show not meaningful.
- Missing costs are clearly marked as provisional rather than silently treated as zero.
- Every profitability view exposes the contributing records and calculation timestamp.
- Finance/Manager/Admin approval is required for sensitive cost corrections.

### 7.4 Batch Health

Use an explainable factor model. For example, evaluate:

- Capacity utilization.
- Enrolment versus minimum target.
- Attendance rate and recent attendance trend.
- Trainer assignment/readiness.
- Outstanding payment exposure.
- Profitability/margin.
- Open high-priority operational issues.

The MVP may map factors to statuses such as **Healthy**, **Watch**, **At Risk**, and **Critical** using documented thresholds. The interface must show the factor values, threshold crossed, and recommended action. Avoid presenting an unexplained single number.

### 7.5 Action generation

- Each condition has an action type, severity rule, owner rule, due-date rule, and deduplication rule.
- Re-running evaluation is idempotent.
- Completing an action records actor, completion time, and optional result/note.
- Actions can be resolved automatically only when the source condition is objectively cleared and policy allows it.
- Dismissal requires a reason for material actions.
- New actions should link directly to the relevant record and proposed next step.

### 7.6 Lifecycle state

Lifecycle is a projection of authoritative events and record statuses. A subject can have multiple parallel states, such as a customer with one paid invoice and another outstanding invoice. Therefore:

- Do not force all business truth into one linear status.
- Display milestone completion plus current open obligations.
- Use timestamps and source records to order events.
- If an expected milestone is missing, show it as pending or not applicable rather than inventing completion.
- Completion and outcome require explicit source records.

### 7.7 Permissions

- Authenticate every protected request.
- Resolve role and organization scope server-side.
- Check action-specific permission, ownership/scope, and record state.
- Enforce RLS independently of UI visibility.
- Prevent client-supplied role, owner, approval, totals, or audit fields from being trusted.
- Record authorization failures where useful without leaking sensitive details.

---

## 8. API and Server Boundaries

| Concern | Client-side responsibility | Server/API responsibility | Database/RLS responsibility |
|---|---|---|---|
| UI state | Filters, modal state, pagination display | — | — |
| Basic validation | Immediate format/required-field feedback | Authoritative validation | Constraints for core shape |
| Authentication | Display session state | Resolve and verify session | Auth integration and policies |
| Authorization | Hide/disable controls for usability | Enforce role, scope, ownership, state | Prevent unauthorized row access |
| CRUD reads | Request data and render | Apply safe filters, scope, pagination | RLS and relational integrity |
| CRUD writes | Submit intent | Validate, authorize, execute domain operation, audit | Constraints, RLS, transaction support |
| Financial totals | Format/display server result | Calculate authoritative totals | Numeric types and constraints |
| Payment allocation | Input payment intent | Allocate and recalculate balances | Referential/integrity constraints |
| Batch health | Display factors | Calculate status and explanation | Store source data/snapshots if used |
| Action Engine | Display/update user action state | Generate, deduplicate, complete, resolve | Persist action and audit state |
| Lifecycle | Render timeline | Assemble authorized event projection | Preserve event references |
| Assistant | Capture question/render answer | Scope query, retrieve facts, call Gemini, log safe metadata | RLS on source data; no direct model access |
| File uploads if later added | Select file | Validate type, size, ownership, malware policy | Storage policies and metadata |

### Write boundary rule

A user action should express intent, such as “convert lead,” “issue invoice,” “record payment,” “mark attendance,” or “complete action.” The server domain service owns the sequence of validation, related updates, derived calculations, lifecycle/activity events, and audit records. Avoid implementing that sequence separately in multiple UI components.

### Transaction rule

Operations that update multiple related records must be atomic where practical. Examples include invoice payment allocation, lead conversion, quote-to-invoice conversion, and attendance updates with downstream action evaluation. If an asynchronous step is used, record an explicit pending/failed state and make retry behavior safe.

---

## 9. Security Model

### Authentication

- Use Supabase Auth for sign-in, sign-out, session refresh, and password/account flows.
- Associate each authenticated identity with an active internal user profile.
- Deny access when the profile is inactive or outside the organization scope.
- Avoid trusting role claims supplied only by the browser.

### Authorization

- Use centralized permission definitions and server-side policy evaluation.
- Enforce least privilege by module, operation, record scope, and sensitivity.
- Require approval states for issuing quotes/invoices, approving expenses, and sensitive corrections.
- Students can access only their own permitted records.

### RLS

- Enable RLS on business tables.
- Policies should scope rows to the organization and permitted ownership/relationship.
- RLS is defense in depth, not a replacement for domain authorization.
- Test both allowed and denied cases for every role.

### Environment variables

Separate public configuration from secrets. Only browser-safe values may use a public prefix. Supabase service-role credentials, Gemini API keys, signing secrets, and privileged database access must remain server-only and must never be committed, logged, rendered, or sent to the browser.

### Gemini protection

- Call Gemini only from trusted server code.
- Use an allowlisted assistant capability set for MVP.
- Pass minimized, authorized, structured facts rather than raw unrestricted records.
- Defend against prompt injection in user-entered notes by treating database text as untrusted content.
- Do not let Gemini issue tool calls that mutate data.
- Add rate limits, timeout handling, and fallback messaging.
- Log safe observability metadata, not secrets or unnecessary sensitive content.

### Financial protection

- Separate finance permissions from general operational visibility.
- Mask or summarize sensitive payment details for non-finance roles.
- Use exact monetary representations and server-side calculations.
- Audit creation, approval, correction, cancellation, and allocation.
- Avoid hard deletion of invoices, payments, expenses, and audit-relevant records.
- Make tax/GST fields explicit and label the product as GST-ready rather than implying tax compliance without jurisdiction-specific validation.

---

## 10. Recommended Project Folder Architecture

This is a conceptual structure for the coding agent to implement later; it is not application code.

```text
project-root/
├─ app/
│  ├─ (auth)/
│  ├─ (dashboard)/
│  │  ├─ command-center/
│  │  ├─ actions/
│  │  ├─ crm/
│  │  ├─ training/
│  │  ├─ finance/
│  │  ├─ profitability/
│  │  ├─ lifecycle/
│  │  ├─ batch-health/
│  │  ├─ money-trail/
│  │  └─ assistant/
│  ├─ api/                     # Thin route handlers only
│  ├─ layout boundary files
│  └─ error/loading/not-found boundaries
├─ components/
│  ├─ ui/                      # Generic design-system components
│  ├─ forms/
│  ├─ tables/
│  ├─ charts/
│  ├─ timelines/
│  └─ domain/                  # Reusable presentation components
├─ domain/
│  ├─ crm/
│  ├─ training/
│  ├─ finance/
│  ├─ profitability/
│  ├─ actions/
│  ├─ lifecycle/
│  ├─ batch-health/
│  ├─ money-trail/
│  └─ assistant/
├─ lib/
│  ├─ auth/
│  ├─ permissions/
│  ├─ validation/
│  ├─ supabase/
│  ├─ money/
│  ├─ dates/
│  ├─ audit/
│  └─ errors/
├─ server/
│  ├─ services/                # Authorized application operations
│  ├─ queries/                 # Read/query functions
│  ├─ commands/                # Mutating use cases
│  ├─ jobs/                    # Reconciliation/action scans if needed
│  └─ integrations/gemini/
├─ types/
├─ config/
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  ├─ authorization/
│  └─ end-to-end/
├─ docs/
│  ├─ architecture/
│  ├─ business-rules/
│  └─ demo/
└─ database/
   └─ migrations/              # Add only during implementation phase
```

The exact framework conventions may vary, but domain logic must remain discoverable and independent of page components. Avoid a giant generic `utils` folder containing business rules.

---

## 11. Dependency-Aware Implementation Order

### Phase 0 — Product contract

1. Freeze MVP scope and demo persona.
2. Define status values, permission vocabulary, calculation basis, timezone, currency, and date conventions.
3. Define the core demo dataset and acceptance criteria.
4. Confirm the role matrix and sensitive data boundaries.

### Phase 1 — Foundation

1. Initialize the Next.js/TypeScript/Tailwind repository.
2. Configure Supabase Auth and environment handling.
3. Establish application profile and role resolution.
4. Establish shared layout, navigation, error/loading states, and design tokens.
5. Implement centralized permission vocabulary and audit approach.

### Phase 2 — Domain and persistence foundations

1. Create domain types and validation contracts.
2. Create identity/organization foundations.
3. Add CRM core entities.
4. Add course, batch, trainer, student, and enrolment foundations.
5. Add finance source entities.
6. Add cross-cutting actions, lifecycle, activity, and audit structures.
7. Add RLS and authorization tests as each domain is introduced rather than at the end.

### Phase 3 — End-to-end operational spine

1. Lead creation and follow-up.
2. Lead conversion to customer.
3. Quote creation and approval.
4. Quote-to-invoice conversion.
5. Payment recording and outstanding calculation.
6. Enrolment into a batch.
7. Attendance capture.
8. Lifecycle timeline projection.

### Phase 4 — Intelligence and action

1. Deterministic profitability calculation.
2. Explainable Batch Health.
3. Action Engine rules and deduplication.
4. Action list, ownership, completion, and result capture.
5. Command Center with drill-down links.
6. Money Trail.

### Phase 5 — Assistant and hardening

1. Implement allowlisted read-only Assistant intents.
2. Add server-side context minimization and source references.
3. Add loading, timeout, unsupported-question, and model-unavailable behavior.
4. Test role-scoped answers and data leakage boundaries.
5. Improve mobile responsiveness and accessibility.
6. Add audit, observability, and error tracking.

### Phase 6 — Demo readiness

1. Seed a believable dataset with both healthy and problematic records.
2. Validate the critical path from lead through action result.
3. Run role-based acceptance tests.
4. Verify production environment variables and deployment preview.
5. Prepare a short demo script and fallback screenshots/data views.
6. Protect the production branch and document known limitations.

---

## 12. AI Tool Responsibility Boundaries

These boundaries assume the tools are used as separate contributors under one GitHub source of truth. Human or lead-agent review remains responsible for integration.

| Tool | Recommended responsibility | Must not independently own |
|---|---|---|
| Manus | Product architecture, requirements interpretation, domain model, permission model, business-rule review, integration plan, acceptance criteria, cross-tool coordination, final review | Unreviewed parallel changes that conflict with the canonical domain model |
| Bolt | Rapid implementation of a bounded full-stack slice after architecture is frozen, such as CRM flow or finance flow | Redefining schema, permissions, calculations, or cross-module contracts without review |
| v0 | UI exploration, responsive layouts, dashboard composition, component prototypes, visual polish | Authoritative business logic, data access policy, finance calculations, or security decisions |
| Replit | Isolated implementation/prototyping, debugging, tests, or a bounded feature when repository sync is controlled | Creating a competing source of truth, deploying unreviewed schema/security changes, or owning production configuration independently |

### Coordination rules

- One canonical branch and one canonical schema plan.
- Each tool receives an explicit scope, acceptance criteria, and files/modules it may change.
- UI generated by v0 must be adapted to the shared component and domain contracts.
- Feature branches or commits must be reviewed before merge.
- No tool may introduce a new status, role, total-calculation rule, or table relationship without updating the architecture record.
- Never let two tools implement the same domain mutation independently.

---

## 13. MVP Versus Optional Scope

### Must work for the hackathon demo

- Authentication and role-aware navigation.
- CRM leads, pipeline stage, owner, follow-up, and overdue detection.
- Lead-to-customer conversion.
- Courses, batches, trainers, students, enrolments, and basic attendance.
- Quotes, invoices, payments, outstanding calculation, and collection view.
- Deterministic batch profitability with visible inputs.
- Explainable Batch Health with a few high-signal factors.
- Action Engine for overdue follow-up, unpaid invoice, low attendance, and at-risk batch.
- Action ownership, status, due date, completion, and result note.
- Lifecycle 360 timeline for the demo customer/student.
- Money Trail for at least one customer or batch.
- Command Center with drill-down metrics.
- Read-only Assistant supporting a small allowlisted set of questions.
- Server-side role checks and basic RLS.
- Mobile-responsive primary screens.

### Important if time allows

- Multiple invoice allocation and partial payments.
- Expense approval workflow.
- Historical Batch Health snapshots and trend charts.
- Customer profitability with robust attribution.
- Richer lifecycle event filtering.
- Saved views and exportable summaries.
- More granular ownership/team scopes.
- Notifications or email reminders.
- Stronger audit-log viewer.
- Automated reconciliation job for action generation.

### Optional/polish

- Advanced forecasting.
- Custom dashboards.
- Multi-organization tenancy.
- Full GST/tax compliance workflows.
- External accounting integrations.
- WhatsApp/SMS/email integrations.
- File/document management.
- Advanced AI narrative reports.
- Offline-first attendance.
- Complex workflow builder.

---

## 14. Demo Critical Path

The shortest complete demonstration should use one realistic lead/customer and one batch with a visible operational issue.

### Suggested story

1. **Data:** A new lead enters the CRM with a source and assigned Sales owner.
2. **Insight:** The Command Center or lead view shows an overdue follow-up and a pipeline risk.
3. **Action:** The Action Engine creates an owned “complete overdue follow-up” action.
4. **Follow-up:** Sales records the contact outcome, schedules the next step, and converts the lead to a customer.
5. **Commercial progression:** The user creates/approves a quote, converts it to an invoice, and records a partial payment so outstanding remains visible.
6. **Training progression:** The customer/student is enrolled into a batch with low attendance or low enrolment.
7. **Operational insight:** Batch Health explains the risk using capacity, attendance, payment, trainer, and profitability factors.
8. **Action:** A batch-risk action is assigned to the Manager or Trainer.
9. **Result:** The user completes the action with a note; the action status, lifecycle/activity feed, and dashboard update.
10. **Assistant:** Ask “What actions require attention today?” and show a read-only answer linked to the same records.

### Demo success criteria

The audience should see that EduPulse 360 does more than display dashboards: it connects operational facts to explainable insights, creates owned work, records the follow-up, and shows the result.

---

## 15. Major Risks and Practical Fallbacks

| Risk | Why it matters | Practical fallback |
|---|---|---|
| Scope explosion | Ten modules can produce disconnected shallow screens | Build one complete critical path first; defer optional integrations and polish |
| Inconsistent business logic | Totals/statuses differ between pages | Centralize domain services and add rule-level tests before expanding UI |
| Weak authorization/RLS | Sensitive finance/student data could leak | Implement role/scope checks with each module and test denied paths explicitly |
| Financial calculation errors | Trust and demo credibility suffer | Use deterministic server calculations, exact money types, snapshots, and visible breakdowns |
| Action duplication | Users lose trust in the Action Engine | Define stable deduplication keys and idempotent generation |
| Unexplainable Batch Health | A black-box score conflicts with product intent | Show factors, thresholds, and recommended action; use simple documented weights |
| AI hallucination | Assistant may invent operational facts | Use allowlisted queries, bounded context, source links, and “insufficient data” responses |
| Gemini outage/latency/cost | Demo may fail at the AI step | Provide deterministic saved questions and graceful unavailable-state fallback |
| Overcoupled schema | Changes in one module break all screens | Use clear domain boundaries, source records, projections, and explicit events |
| Poor mobile usability | Users cannot execute actions in the field | Design action-first mobile views, responsive tables, and compact detail panels early |
| Data seeding weakness | Empty dashboards do not demonstrate value | Prepare a repeatable demo dataset with healthy, overdue, unpaid, and at-risk examples |
| Tool overlap | Bolt/v0/Replit changes conflict | Use one canonical architecture, scoped branches, and review gates |
| Tax/GST ambiguity | Incorrect compliance claims | Label fields GST-ready, keep jurisdiction rules configurable, and avoid claiming compliance |
| Incomplete lifecycle model | Timeline becomes a duplicate inconsistent status system | Treat lifecycle as a projection of source events and statuses |

---

## 16. Requirements Traceability Checklist

| Requirement | Implementing module(s) | Verification evidence |
|---|---|---|
| CRM leads | CRM | Lead list/detail, create/edit, stage and source filters |
| Follow-ups | CRM, Action Engine | Activity history, due dates, overdue actions |
| Customers | CRM, Shared Foundation | Conversion flow and customer detail |
| Lead pipeline/source/owner | CRM | Pipeline view and assignment behavior |
| Conversion tracking | CRM, Lifecycle | Converted lead status and lifecycle event |
| Courses | Training/LMS | Course catalog and batch linkage |
| Batches | Training/LMS | Batch list/detail, statuses, capacity |
| Trainers | Training/LMS, Finance | Assignment and trainer cost visibility rules |
| Students | Training/LMS | Student profile and role-scoped access |
| Enrolments | Training/LMS | Enrolment creation and batch roster |
| Attendance | Training/LMS | Session/record capture and summary |
| Batch status/capacity | Training/LMS, Batch Health | Status transitions and utilization |
| Batch Health | Batch Health | Explainable factor panel and status |
| Quotations | Finance | Draft, approval, line totals |
| Invoices | Finance | Quote conversion and due status |
| Payments | Finance | Payment entry and allocation |
| Collections/outstanding | Finance, Action Engine | Outstanding list and overdue action |
| Expenses | Finance | Expense entry/approval and attribution |
| GST-ready fields | Finance | Tax fields and clear non-compliance labeling |
| Financial summaries | Finance, Command Center | Period-defined summary cards |
| Revenue/expenses/profit/margin | Profitability | Calculation breakdown and tests |
| Batch/customer profitability | Profitability | Batch view; customer view where attribution supports it |
| Deterministic calculations | Finance, Profitability | Unit/integration tests and server-only calculation path |
| Action types/priority/source/owner/status | Action Engine | Action detail and deduplication behavior |
| Action due/completion fields | Action Engine | Completion workflow with timestamps and result note |
| Lifecycle 360 | Lifecycle | Cross-module timeline with source links |
| Money Trail | Money Trail | Quote-to-profit chain and missing-link indicators |
| Command Center | Command Center | KPI drill-downs and high-priority queue |
| Read-only Assistant | Assistant | Supported question tests and no-write security tests |
| Server-side permissions | Foundation, all modules | Role/ownership authorization test matrix |
| Supabase RLS | Database/security | Allowed/denied row access tests |
| Mobile-first UI | Shared UI, all primary screens | Responsive checks at mobile and desktop widths |
| GitHub single source of truth | Delivery foundation | Branch/review and documented ownership rules |
| Vercel deployment target | Delivery foundation | Preview/production configuration checklist |
| Gemini API protection | Assistant/security | Server-only key, bounded context, timeout fallback |

---

## 17. Final Blueprint Decisions for the Coding Agent

1. **Build the operational spine before broad reporting:** lead → customer → quote → invoice → payment → enrolment → attendance → action.
2. **Treat actions as first-class records**, not merely dashboard labels.
3. **Treat Lifecycle 360, Money Trail, Command Center, and Assistant as read models over authoritative domain data**, not competing sources of truth.
4. **Make every financial and health result explainable.** Show inputs, calculation basis, freshness, and missing data.
5. **Use server-side domain services for all important mutations and calculations.** UI components should compose screens, not define business policy.
6. **Start with a narrow, reliable Assistant.** Deterministic supported questions are better than broad but unreliable chat.
7. **Protect sensitive data by default.** Finance, trainer costs, student data, and role administration require explicit permissions.
8. **Optimize for the demo critical path:** a visible problem becomes an owned action, receives a follow-up, and produces a recorded result.
9. **Keep all tools aligned to this blueprint and one repository.** No parallel schema or permission definitions.
10. **Do not begin database-table implementation until status vocabularies, ownership rules, calculation basis, and MVP acceptance criteria are approved.**
