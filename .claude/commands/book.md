---
description: Record a booking
---

# Record a booking

Read `CLAUDE.md`. Run `npm run reservations -- book "<reference>" --guest="<guest>" --venue="<venue>" --start="<ISO timestamp with offset>" --end="<ISO timestamp with offset>" --covers=<count>`. Use `--json` for exact records. Replace placeholders with facts supplied by the operator, never guesses. Resolve ambiguous names using the listed ids. Read the booking before changes. Report the result and any exceptions. Never send anything.
