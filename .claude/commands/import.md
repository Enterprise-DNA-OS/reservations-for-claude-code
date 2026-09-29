---
description: Bring over the ResDiary booking export
---
# Import
Read `docs/replace-resdiary.md` before acting. Inspect the actual CSV headers and date format. Register the venue with its real timezone and capacity, then run `npm run reservations -- import resdiary <file> --venue=<venue> --timezone=<IANA timezone> --duration-minutes=<agreed duration> --dry-run --json`. If the headers differ, create a mapping file as documented. Report the preview and import without `--dry-run` when instructed. Reconcile source row count, covers and visit dates with the service sheet. Import never sends or changes online availability.
