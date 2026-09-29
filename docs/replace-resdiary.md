# Bring your ResDiary bookings across

The [ResDiary export guide](https://help-resdiary.theaccessgroup.com/en/articles/12333284-export-all-your-data-from-your-diary) and [booking details guide](https://help-resdiary.theaccessgroup.com/en/articles/12332262-create-your-booking-details-report), checked 29 September 2026, document CSV export. In Reports, open Booking Reports and select Booking details. Set the venue, visit date range and required columns, including customer email and visit time. Run the report and export CSV. Export past history and future bookings for reconciliation. The vendor recommends disabling online availability before final export; decide the cutover with the venue and its replacement booking channel before doing that.

## One import command

Register the real venue first using `add-venue "Venue" --timezone=Pacific/Auckland --capacity=32` through the reservations CLI. Use a fresh DATA_DIR for real records, never the demo database.

```bash
npm run reservations -- import resdiary bookings.csv --venue="Venue" --timezone=Pacific/Auckland --duration-minutes=120 --dry-run --json
```

Remove `--dry-run` to write. The duration is an explicit operating assumption used only when the export has no end timestamp. Agree it first. The preview validates all records and rolls back. A bad row or changed existing booking rolls back the whole file. Repeating the identical import inserts nothing. Changed exports require explicit reconciliation so local notes and status changes cannot be silently lost.

## Column contract

Report columns are configurable. No real customer export was available for this build. Tests use a synthetic fixture, not a claimed vendor sample. Inspect the actual header before cutover; if it differs, provide `--map=column-map.json` with keys below mapped to exact source headings. Extra columns are not imported. Preserve the original export securely.

| Key | Default accepted headings | Treatment |
|---|---|---|
| reference | Booking Reference, Reference, Booking ID | Required, stable within the venue |
| name | Customer Name, Name, Guest Name | Required; same-name diners are not merged on name alone |
| email | Customer Email, Email | Optional, lowercased |
| phone | Phone, Telephone, Mobile | Optional, kept as text |
| start | Visit Date and Time, Visit Date & Time, Start | Required; ISO with offset or local YYYY-MM-DD HH:MM and explicit timezone |
| end | End, End Time | Full ISO timestamp with offset; otherwise explicit duration required |
| covers | Covers, Party Size | Required positive integer |
| status | Status, Booking Status | Required: enquiry, confirmed, seated, completed, cancelled, no-show |
| channel | Channel, Booking Source | Preserved, defaults to import |
| allergy | Allergy Note, Dietary Requirements | Kept on booking; acknowledgement starts blank |
| notes | Notes, Booking Notes | Preserved |

Example map: `{"reference":"Reservation Number","name":"Diner","start":"Visit Date and Time","covers":"Guests"}`. For DD/MM/YYYY HH:MM use `--date-order=dmy`. Ambiguous daylight-saving times require an explicit offset. Split date and time columns must be combined before import; unsupported status labels need deliberate mapping to the listed statuses. Never guess.

## What carries over

Bookings and associated guest contact details, counts, dates, statuses, source and selected notes. Imported bookings start without physical seating assignments: configure the actual seating and run assign after checking the service sheet. A guest matches only when name, email and phone all match exactly after email normalisation. Shared contact details with different names stay separate.

The standalone customer list, marketing opt-ins, attachments, floor-plan coordinates, menus, deposits, card tokens, payment history and online booking channels are outside this importer. Keep those exports separately; map additional records as part of the custom version. This is a guest book and service workflow, not a replacement booking website or payment processor.

## Reconcile before cutover

Compare booking count, total covers, visit dates in venue local time, statuses and notes against the export. Run service-sheet, covers-forecast, guest-book and attention. Check each future booking, including unassigned seating. Keep the existing booking channel operating until its replacement is tested. Back up with `export --out=backup.json` using a new filename. The export contains every domain table; restore to a disposable database first with an operator-reviewed script in dependency order. No automatic restore or sending is provided.
