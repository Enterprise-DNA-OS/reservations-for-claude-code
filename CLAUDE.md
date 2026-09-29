# Reservations for Claude Code

Read before acting. This is a trusted operator tool for the restaurant guest book and service briefing.

## Business context

Business: fill in your venue names, location and booking channels. Operator: fill in your name and role. Priorities: accurate arrival times, no conflicting assignments, dietary handovers before service, and complete guest history.

## Rules

- Every answer about the restaurant begins with CLI records. Never invent a booking, contact, allergy or acknowledgement.
- Read a booking or guest before a change. Resolve ambiguous names by id.
- Never send, charge a card, disable a booking channel or delete records from here. Draft to drafts/ for human review.
- Kitchen acknowledgement must come from a named person who received the handover. It does not certify meal safety.
- See docs/compliance.md before discussing legal or dietary controls. Distinguish house review policies from legal obligations.
- Protect contact and dietary information. No exports to third parties without the operator's authority.
- Never seed an operational database. npm test uses a disposable DATA_DIR and ignores DATABASE_URL.
- Add numbered migrations rather than editing applied ones. Test changes before applying them to operational data.

## Routing

| Ask | Command |
|---|---|
| Prepare the next service | `/service-sheet` |
| Review covers by day, venue and channel | `/covers-forecast` |
| Review guest history | `/guest-book` |
| Review repeat missed visits and upcoming bookings | `/no-shows` |
| Find previous diners with no upcoming booking after sixty days | `/lapsed-guests` |
| Review declared allergies and kitchen acknowledgement | `/kitchen-handover` |
| Follow up group enquiries | `/enquiries` |
| Compare bookings, covers, cancellations and no-shows by source | `/channel-review` |
| Resolve missing seating, overdue outcomes and handovers | `/attention` |
| Review record checks against cited rules | `/compliance` |
| List venue capacity and timezones | `/venues` |
| List seating capacity | `/dining-tables` |
| Read one guest and their bookings | `/guest` |
| Read one booking and its notes | `/booking` |
| Record a new guest | `/add` |
| Record a booking | `/book` |
| Assign seating after checking the service sheet | `/assign` |
| Record the service outcome | `/status` |
| Record a real kitchen acknowledgement | `/acknowledge` |
| Record a conversation or service note | `/log` |
| Record why guest history is still needed | `/retention-review` |
| Export all records into a new backup file | `/export` |
| Draft a confirmation for a person to review | `/draft-confirmation` |
| Monday review | `/weekly-review` |
| Bring data across | `/import` |
| Change the system | `/customise` |
| New printable briefing | `/new-view` |

CLI: `npm run reservations -- help`. Records live in Postgres via DATABASE_URL or local PGlite in DATA_DIR. Render paperwork with npm run docs and briefings with npm run view. Edit brand.json to put the venue's name on them. Read docs/replace-resdiary.md before import. No web front end is included.

Built and run for you by Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/resdiary
