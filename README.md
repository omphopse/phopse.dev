# phopse.dev

A recruiter-first portfolio for Om Phopse with an optional, simulated Developer OS. Built with React, Vite, TypeScript, Tailwind CSS and Lucide icons. Portfolio content lives in typed data modules so facts and links can be updated without rewriting components.

Professional experience, completed programs, and education are kept in separate typed data modules: `src/data/experience.ts`, `src/data/certifications.ts`, and `src/data/education.ts`. The professional page, Developer OS Career app, and terminal read these shared records.

## Run locally

```sh
npm install
npm run dev
```

Then open the local Vite URL. Useful checks: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

## Content and assets to confirm

- Add a real resume PDF as `public/resume/om-phopse.pdf`, then set `links.resume` in `src/data/profile.ts` to `/resume/om-phopse.pdf`.
- Add a contact email in the same profile file if it should be public.
- Confirm project implementation details, exact features, and any desired source repositories. Missing URLs are intentionally not fabricated.
- Confirm whether the Roomlinks URL remains current before publishing it.
- Optionally provide a canonical production URL and social preview image; metadata can then be completed.

Historical Projectmart figures are approximate cumulative results and are explicitly labeled historical. Roomlinks audience/listing numbers are omitted as potentially stale. No testimonials, availability claim, employment claim, production metrics, or fabricated resume are included.

## Contact delivery

The form makes a JSON POST to the Supabase Edge Function URL in `VITE_CONTACT_FUNCTION_URL`. Without that URL, the UI reports that delivery is not configured; it never fakes a success. The function validates again, limits payload size and input lengths, includes a honeypot and a best-effort per-isolate rate limit, and sends mail through Resend. It does not store submissions.

1. Create a Supabase project and install/authenticate the Supabase CLI.
2. Set secrets on the project (do not put these in Vite variables or commit them):

   ```sh
   supabase secrets set RESEND_API_KEY=re_... CONTACT_TO_EMAIL=you@example.com CONTACT_FROM_EMAIL="Portfolio <verified-sender@example.com>" CONTACT_ALLOWED_ORIGIN=https://your-site.vercel.app
   ```

3. Deploy the function: `supabase functions deploy contact --no-verify-jwt`.
4. Set `VITE_CONTACT_FUNCTION_URL=https://<project-ref>.supabase.co/functions/v1/contact` in local `.env.local` and Vercel's project environment settings, then redeploy.
5. Verify the sender domain/address in Resend. Set `CONTACT_ALLOWED_ORIGIN` to the exact production origin; for local development, update it temporarily to the local Vite origin.

The Edge Function's in-memory limiter is best-effort and may reset between isolates. For stronger abuse controls, configure Supabase gateway or hosting WAF rate limits before public launch. No database is used. The Supabase function can only deliver to the configured destination, never a visitor-selected recipient.

## Vercel deployment

1. Push this project to a GitHub repository.
2. Import it into Vercel. The build command is `npm run build`, output directory `dist` (Vercel detects Vite automatically).
3. Add `VITE_CONTACT_FUNCTION_URL` if contact delivery is configured. Never add Resend credentials as `VITE_` variables.
4. Deploy. `vercel.json` routes application paths to the SPA entrypoint.
5. Add a custom domain later in Vercel's project settings and update the canonical URL / allowed contact origin.

## Notes

- Developer OS is a frontend UI simulation. Terminal input uses a strict command allowlist; no shell, `eval`, filesystem, or arbitrary code execution.
- Desktop supports app opening, focus and z-order, drag, resize, minimize/restore, maximize, close and dock indicators. Mobile uses full-screen panels and touch-friendly app navigation.
- Resume is intentionally an unavailable state until the real PDF is supplied.
- There is no backend integration test without Supabase and Resend credentials.
