# MAPIMS Standard Operating Procedure (SOP)

## 1. Document Control

- **Project:** MAPIMS - Hospital Ticket Management System
- **Document:** Standard Operating Procedure (SOP)
- **Version:** 1.0
- **Owner:** IT Operations / Helpdesk Governance Team
- **Effective Date:** Immediate
- **Review Frequency:** Quarterly or after major workflow changes

---

## 2. Purpose

This SOP defines how MAPIMS users create, triage, assign, transfer, resolve, confirm, and close tickets across hospital operations. It standardizes role permissions, AI-assisted flows, reliability controls, and audit requirements.

---

## 3. Scope

This SOP applies to all ticket activity in MAPIMS, including:

- IT, telecom, and network incidents
- Facilities and operational service issues
- Clinical support requests routed via helpdesk
- Cross-department workflows, including HOD-to-HOD ticketing

---

## 4. Role Definitions and Responsibilities

### 4.1 Requester

- Create tickets
- View own tickets
- Add public comments and attachments
- Confirm resolution before final close

### 4.2 Helpdesk

- View operations tickets
- Claim unassigned tickets
- Update working statuses
- Resolve tickets assigned to self
- Request transfer from another helpdesk assignee
- View AI problem/solution tips on ticket details

### 4.3 HOD

- Create tickets (including HOD-to-HOD requests)
- View operations tickets
- Directly assign/transfer to helpdesk without transfer-request approval flow
- Monitor ticket progress and SLA

### 4.4 Admin

- Full governance access
- User/master data/SLA configuration
- Exception handling (closure override when operationally necessary)

---

## 5. End-to-End Workflow

## 5.1 Ticket Creation (AI-first flow)

1. User opens `Create Ticket`.
2. User enters:
   - One issue input (required)
   - Attachment (optional)
3. Backend AI/inference determines:
   - Priority
   - Department
   - Category
   - Subcategory
   - Location
4. Ticket is created in `OPEN` state.
5. Activity log writes `CREATED`.

## 5.2 Assignment and Handling

1. Staff claims ticket or receives transfer/assignment.
2. Assigned staff updates status to `IN_PROGRESS`, `ON_HOLD`, etc.
3. Comments and attachments document progress.

## 5.3 Resolution and Confirmation

1. Helpdesk marks ticket `RESOLVED` after fix.
2. Requester verifies issue outcome.
3. Requester selects confirmation action to close ticket.
4. Ticket transitions to `CLOSED`.
5. Activity log records requester confirmation and closure.

## 5.4 Reopen

- Authorized operations users can reopen if issue recurs.
- Reopen resets resolution confirmation-related closure context.

---

## 6. AI in MAPIMS

## 6.1 AI Classification at Creation

AI is used at ticket creation to auto-classify issue metadata from user input:

- Priority suggestion
- Department and category mapping
- Subcategory selection
- Location inference

If the AI/inference signal is weak or unavailable, fallback logic must still classify ticket safely and permit creation.

## 6.2 AI Ticket Problem Suggestions

During issue typing, the system should provide assistive suggestions:

- Suggested problem statements/titles
- Suggested classification hints
- Similar existing ticket hints (optional)

Rules:

- Suggestions are optional and non-blocking.
- User can ignore suggestions and continue.
- Suggestion failure must not block ticket creation.

## 6.3 AI Solution Tips

For active/resolved tickets, AI can provide problem-specific solution tips:

- Helpdesk can view and use tips during handling.
- Requester can view tips for verification.
- Tips are guidance only and do not auto-change ticket status.

Recommended tip structure:

- 3-7 actionable steps
- Safety caution (if relevant)
- Verification step
- Escalation trigger when unresolved

---

## 7. Transfer and Assignment SOP

## 7.1 Helpdesk to Helpdesk Transfer Request

1. Agent A opens ticket assigned to Agent B.
2. Agent A sends transfer request.
3. Agent B receives and approves/rejects.
4. On approval, ticket transfers to Agent A.
5. Request state remains visible in transfer-request views.

## 7.2 HOD/Admin Direct Assignment

- HOD/Admin can assign transfer directly to helpdesk.
- No transfer-request approval cycle is needed.
- Helpdesk sidebar should surface leadership assignment notices.

---

## 8. Status Governance Rules

- Helpdesk cannot perform restricted actions on another helpdesk assignee's ticket.
- Resolve does not auto-finalize closure.
- Final closure requires requester confirmation (except approved admin override conditions).
- Status updates must follow controlled transitions and server-side checks.

---

## 9. Requester Confirmation Policy

- `RESOLVED` means fix applied by support.
- `CLOSED` means requester confirmed fix outcome.
- Requester confirmation must be captured as an auditable action before close in normal flow.
- Admin override close is exception-only and must include reason.

---

## 10. Comments, Attachments, and Communication

- Public comments available to permitted participants.
- Internal comment visibility/action depends on role permissions.
- Attachments allowed by configured type/size policy.
- User-facing errors must be concise and non-technical.

---

## 11. SLA and Escalation

- SLA deadlines should be tracked continuously.
- Overdue tickets flagged for escalation.
- Authorized roles can escalate overdue cases.
- Escalation queue is reviewed in daily operational sync.

---

## 12. Security and Access Control

- JWT authentication required for all protected APIs.
- Role-based authorization enforced server-side for all actions.
- No sensitive internals exposed in user-facing errors.
- AI integrations must avoid leaking secrets and respect data handling policies.

---

## 13. Reliability and Failure Handling

- AI calls should use timeout and retry with exponential backoff.
- If AI classification/suggestion/tips fail, workflow must degrade gracefully:
  - Ticket create still succeeds
  - Suggestion/tips UI fails silently with safe fallback messaging
- No unhandled promise failures in action flows.

---

## 14. Audit and Traceability

All critical actions must be logged with actor, timestamp, and context:

- Ticket creation
- Claim/assignment/transfer
- Status changes
- Resolve
- Requester confirmation and close
- Reopen
- Escalation
- Transfer request decisions

Recommended for AI logs:

- Inference source/model
- Inferred fields
- Fallback-used flag
- Errors (internal only)

---

## 15. Daily Operations Checklist

- Review unassigned ticket queue
- Review overdue/escalated tickets
- Process pending transfer requests
- Follow up on resolved tickets waiting requester confirmation
- Verify assignment notices for helpdesk

---

## 16. Weekly Governance Checklist

- SLA trend review
- Reopen analysis
- Transfer turnaround analysis
- AI suggestion/tip usefulness review
- Classification correction rate review
- Exception closure audit

---

## 17. KPI Framework

- First response time
- Mean resolution time
- Resolved-to-confirmed-close cycle time
- Reopen percentage
- Overdue percentage
- Transfer request approval latency
- AI fallback rate
- AI suggestion adoption/helpfulness rate

---

## 18. Exception and Override Policy

- Admin override actions are permitted only for justified operational needs.
- Override reason must be logged.
- Overrides are included in periodic governance audit.

---

## 19. Change Management

Any workflow change must include:

- Impact analysis by role
- API + UI regression checks
- Lint/build verification
- SOP update and version bump

---

## 20. User Training and Adoption

All users should be trained on:

- AI-assisted create-ticket flow
- Transfer request vs direct leadership assignment
- Requester-confirmed closure model
- Use of comments, attachments, and activity log
- Escalation criteria and SLA expectations

---

## 21. SOP Acceptance

This SOP is accepted for MAPIMS operations once approved by project owner and operations governance leads.

