# Why no front end

The working record is a database. An operator asks a coding agent for a service sheet, guest history or weekly review. The commands return data; printable HTML views show the same records without a server.

A staffed restaurant also uses live seating screens, a mobile device, offline access and a public booking widget. This free base has none of those. There is no drag and drop, payment collection, channel feed or automatic confirmation. Enterprise DNA builds the required interface and connections into a custom version. Keep the existing booking channel until its replacement is tested.

PGlite suits one local operator at a time. Use a managed Postgres database for shared records and establish access controls, backups and restore tests before operational use. The CLI is a trusted operator tool; it does not provide per-user authentication. Rendered service sheets are snapshots and must be regenerated after changes. Protect files containing contact or dietary information.
