# Dashboard Queries

Log in with your existing dashboard account and open /dashboard/queries.
The page reads portfolio_contact_requests directly through the Supabase client.
Search, type filters, and pagination use normal table queries. There is no reader
list or custom database listing function.

If the earlier setup was applied, run supabase/queries-cleanup.sql once in the
Supabase SQL Editor. It removes the extra reader table/function and enables
read-only access for logged-in users. Contact records are preserved.
This permission applies to every authenticated account, matching the requested
login-based dashboard behavior. Public visitors cannot read the table.

No UUID registration, Express backend, or Edge Function redeployment is needed.
