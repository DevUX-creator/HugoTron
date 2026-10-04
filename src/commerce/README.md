# Commerce integration

The canonical backend handoff is in **[docs/handoff](../../docs/handoff/README.md)**.
Read the [open items](../../docs/handoff/OPEN-ITEMS.md) and
[integration contract](../../docs/handoff/INTEGRATION.md) before implementing an adapter.

This folder holds logic, schemas and server-side service boundaries. Screens live in
`src/components/commerce/`. The default backend is a demonstration, not production storage.
Catalogue/stock/quotes, PSP UI, durable transactions, email and operational work remain;
registering an adapter alone is not sufficient for launch.
