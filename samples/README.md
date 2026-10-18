# Sample data

- **`lendly-sample-backup.json`**: a Lendly backup with 6 people, 8 loans and 6 payments covering every status (overdue, due today, due soon, on track, paid on time, paid late, forgiven). Restore it from **Settings → Your data → Restore** to try the app with realistic data. Dates were relative to the day it was generated (18 Oct 2026), so statuses shift as time passes.
- **`lendly-sample-export.csv`**: what **Export CSV** produces for that backup. Phone numbers start with `'` on purpose: it stops spreadsheets from treating a leading `+` as a formula.

Restoring replaces everything in the current ledger (or organisation).
