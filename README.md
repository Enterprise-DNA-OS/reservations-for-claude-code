<h1 align="center">Reservations for Claude Code</h1>

<p align="center">
  <strong>The open-source restaurant reservations and guest book system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your ResDiary data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=resdiary">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/resdiary?utm_source=github&utm_medium=readme&utm_campaign=resdiary">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-resdiary">Instead of ResDiary</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

A restaurant guest book and service workflow: bookings, covers, dining-table assignments, no-shows, group enquiries and kitchen handovers. Ask Claude Code, Codex, OpenCode or Cursor to run the commands against a database you own. This is the operating record, not an online booking widget or card guarantee service.

ResDiary's [AUD pricing](https://resdiary.com/pricing-aud), checked 29 September 2026, lists Connect A$115, Express A$170 and Pro A$220 per month plus GST. Twelve monthly payments on Pro are A$2,640 before GST, setup and add-ons. These are published subscription prices, not a verified customer's total annual bill. The free code has no licence fee; hosting and your chosen agent have their own costs.

Enterprise DNA brings your records across, customises the rules and runs your version through **Omni by Enterprise DNA**. One setup fee, then a retainer. A web front end or different stack is part of the scoped custom work.

## Quick start

```bash
npm install
npm test
npm run demo
npm run reservations -- service-sheet
npm run reservations -- attention --json
npm run view
npm run docs
```

Use Node 20 or newer. The embedded PGlite database needs no separate install. The fictional demo has two venues, four guests and seven bookings: an unacknowledged peanut allergy, missing seating, a stale service outcome, repeat no-shows and a group enquiry. Demo dates are relative to first seed; repeating seed does not move them or overwrite edits.

Start with `/attention`. Set DATA_DIR to a separate path for real data. For shared Postgres, set DATABASE_URL and run npm run migrate. Demo seeding refuses hosted databases unless ALLOW_DEMO_SEED=yes. Migration SQL uses built-in UUID generation and no extensions. See [why no front end](docs/why-no-front-end.md) for deployment boundaries.

## The commands

| Command | Purpose |
|---|---|
| `/service-sheet` | Prepare the next service |
| `/covers-forecast` | Review covers by day, venue and channel |
| `/guest-book` | Review guest history |
| `/no-shows` | Review repeat missed visits and upcoming bookings |
| `/lapsed-guests` | Find previous diners with no upcoming booking after sixty days |
| `/kitchen-handover` | Review declared allergies and kitchen acknowledgement |
| `/enquiries` | Follow up group enquiries |
| `/channel-review` | Compare bookings, covers, cancellations and no-shows by source |
| `/attention` | Resolve missing seating, overdue outcomes and handovers |
| `/compliance` | Review record checks against cited rules |
| `/venues` | List venue capacity and timezones |
| `/dining-tables` | List seating capacity |
| `/guest` | Read one guest and their bookings |
| `/booking` | Read one booking and its notes |
| `/add` | Record a new guest |
| `/book` | Record a booking |
| `/assign` | Assign seating after checking the service sheet |
| `/status` | Record the service outcome |
| `/acknowledge` | Record a real kitchen acknowledgement |
| `/log` | Record a conversation or service note |
| `/retention-review` | Record why guest history is still needed |
| `/export` | Export all records into a new backup file |
| `/draft-confirmation` | Draft a confirmation for a person to review |
| `/weekly-review` | The Monday briefing from covers, attention and no-shows |
| `/import` | Validate and import the ResDiary booking export |
| `/customise` | Add a field or change a house rule with a tested migration |
| `/new-view` | Add a printable read-only briefing |

Run `npm run reservations -- help` for CLI names. Mutation examples live in each command recipe. Names match case-insensitively and ids accept prefixes; ambiguous matches list candidates and exit with an error. Booking timestamps require an explicit UTC offset. Seating assignments reject conflicts, cross-venue assignments and excess covers; unassigned bookings appear in attention. Aggregate venue capacity is a planning number, not an automatic booking rejection.

## Ten questions answered today

These combine your own history and working rules. We have not verified that ResDiary cannot answer each one.

- Which bookings still need a kitchen handover? `npm run reservations -- kitchen-handover`
- Who has missed visits and booked again? `npm run reservations -- no-shows`
- Which upcoming parties have no seating assignment? `npm run reservations -- attention`
- Which completed diners have been away for sixty days with no booking ahead? `npm run reservations -- lapsed-guests`
- Which channel brought the most covers at each venue? `npm run reservations -- channel-review`
- Which past services still have no recorded outcome? `npm run reservations -- attention`
- Which group enquiries are waiting for an answer? `npm run reservations -- enquiries`
- Which guest records are past their retention review date? `npm run reservations -- compliance`
- What covers are expected by date, venue and booking source? `npm run reservations -- covers-forecast`
- What are the booking history and notes behind this guest name? `npm run reservations -- guest "Mere Wilson"`

## Your first hour: ten things to ask for

1. Show the next service.
2. Show what needs a decision.
3. Find repeat no-shows with upcoming bookings.
4. Read Mere Wilson's history.
5. Show pending kitchen handovers.
6. Add our actual venue and timezone.
7. Add our real seating capacities.
8. Run a preview of our booking export.
9. Put our business name and colours in brand.json.
10. Add an occasion field through /customise and a new read view through /new-view.

## Instead of ResDiary

Read [the switch guide](docs/replace-resdiary.md). A documented booking CSV is the entry point. The importer supports configurable column mapping, explicit local timezone or offset timestamps, whole-file rollback and repeat-import protection. It does not assume a booking is marketing consent, copy card details or send anything.

## Documents, views and record checks

`npm run docs` renders service sheets and kitchen handovers. `npm run view` renders service and week dashboards. Both use brand.json and escape record values. The outputs stay local and contain internal information. Draft confirmations go to drafts/ for a person to review and send. `/compliance` flags allergy handovers and overdue guest retention reviews using [cited rules](docs/compliance.md); it is not a legal or food-safety certification.

## Architecture

One CLI in scripts/reservations.mjs; one adapter in scripts/lib/db.mjs. Plain SQL in supabase/migrations and idempotent demo data in supabase/seed.sql. Commands live in .claude/commands. CLAUDE.md and AGENTS.md route every runtime to the same instructions. Exports contain all five domain tables. Tests use a temporary local database and leave operator data alone.

## Want it installed and run for you?

[Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=resdiary). Enterprise DNA maps your export, builds the missing connections and interfaces, and operates your system inside Omni by Enterprise DNA. Setup fee, then a retainer.

## License

MIT. Copyright (c) 2026 Enterprise DNA.
