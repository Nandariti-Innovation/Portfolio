# Portfolio contact modal — no Express server

All integration source is inside `frontend`. React calls the Supabase `portfolio-contact` Edge Function directly. Supabase stores the enquiry and sends its notification through Resend. The existing `backend` folder is not used.

## 1. Browser environment

Copy `.env.example` to `.env`, preserving any existing values. Set your existing public `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These are the only browser values needed for this form. Do not add a Resend or Supabase service-role key to a `VITE_*` variable.

## 2. Database

Run `supabase/migrations/20260914000000_portfolio_contact.sql` in your project's Supabase SQL Editor. This creates the private enquiry table and a service-role-only reservation function. It does not use the previous Express integration's table.

## 3. Email configuration

Copy `supabase/functions/.env.example` to `supabase/functions/.env`. This is a separate, ignored file inside frontend for Edge Function secrets, not browser configuration.

Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_TO_EMAIL`, and `CONTACT_ALLOWED_ORIGINS`. The sender must use your verified Resend domain. The recipient is your Gmail address. Include exact browser origins (no trailing slash): localhost, your Codespace's port-5173 URL, and your deployed domain as appropriate.

Supabase automatically supplies `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` in its hosted runtime. Never copy the service-role key into the React environment.

## 4. Deploy the function

With the Supabase CLI installed, run from `frontend`:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set --env-file supabase/functions/.env
supabase functions deploy portfolio-contact
```

The checked-in function config disables JWT verification for this intentionally public form. Visitors do not need accounts. The function validates input and allowed browser origins; a database-backed limit allows at most 3 new enquiries per email and 30 total per 15 minutes. CORS is a browser restriction, not bot authentication; add CAPTCHA if spam becomes a problem.

Alternatively create an Edge Function named `portfolio-contact` in the Supabase dashboard, copy both TypeScript files into it, turn off JWT verification for this function, and add the secrets in Edge Functions → Secrets.

## 5. Start React

```bash
npm run dev
```

No Express server, `/api/contact` proxy, or `VITE_API_BASE_URL` is required. Clicking Available for work opens the modal. Test a submission and check the `portfolio_contact_requests` row and Resend delivery logs. A saved enquiry is successful even if its email notification fails. The response includes `saved` and `emailSent`; the modal displays the returned message. Delivery/bounces for accepted emails are visible in Resend.

## Retry behavior

Unchanged retries reuse a UUID and Resend idempotency key. Database reservations are atomic across Edge Function instances. Provider failure or missing email credentials returns HTTP 202 with `saved: true` and `emailSent: false`. The modal confirms receipt without asking visitors to submit duplicate enquiries. Records with null `resend_id` can be reviewed in Supabase; no automatic retry worker is included. An uncertain request older than 23 hours is not automatically resent. Changing fields after a failed submission creates a new enquiry.

## Environment files

`frontend/.gitignore` ignores `.env` and `.env.*` at all depths except `.env.example`. If your frontend environment file was previously tracked, remove it from Git's index before adding private values (`git rm --cached frontend/.env` from the repo root). Ignore rules do not untrack existing files.

## Reference

- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/functions/auth
- https://resend.com/docs/api-reference/emails/send-email

Run the mocked tests with `node --test tests/contact-function.test.cjs` from frontend. Implementation checks use mocked external requests; deployment, SQL execution, and real email delivery require the configuration above.

## Save-first fix deployment

The shipped function accepts localhost, deepanshugulia.in (with and without www), and the current stunning-spoon Codespace origin by default. `CONTACT_ALLOWED_ORIGINS` adds more exact origins and tolerates trailing slashes. Unknown origins remain rejected.

After pulling changes, run from frontend:

```bash
npx supabase functions deploy portfolio-contact --project-ref nwacsfxeexspkaspjwjd
```

Or replace `handler.ts` in the Supabase function editor and click Deploy. GitHub pushes do not update an already deployed Edge Function. No new SQL is needed. Secrets for Resend can now be missing without preventing the database save. Database configuration/SQL errors still fail visibly; Edge Function logs include the failing stage without message contents or secrets.
