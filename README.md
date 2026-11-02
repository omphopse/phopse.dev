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

- The public resume PDF is `public/omphopse.pdf`; `links.resume` points to `/omphopse.pdf` for viewing and download.
- The Contact section displays the public email from `links.email` in `src/data/profile.ts` and opens it with the visitor's email app.
- Confirm project implementation details, exact features, and any desired source repositories. Missing URLs are intentionally not fabricated.
- Confirm whether the Roomlinks URL remains current before publishing it.
- Optionally provide a canonical production URL and social preview image; metadata can then be completed.

Historical Projectmart figures are approximate cumulative results and are explicitly labeled historical. Roomlinks audience/listing numbers are omitted as potentially stale. No testimonials, availability claim, employment claim, production metrics, or fabricated resume are included.

## Contact

The portfolio and Developer OS show the public email address and use a `mailto:` link. Visitors can contact Om through their configured email app; no contact form backend, Supabase secrets, or Vercel environment variables are required.

## Vercel deployment

1. Push this project to a GitHub repository.
2. Import it into Vercel. The build command is `npm run build`, output directory `dist` (Vercel detects Vite automatically).
3. Deploy. `vercel.json` routes application paths to the SPA entrypoint.
4. Add a custom domain later in Vercel's project settings and update the canonical URL.

## Notes

- Developer OS is a frontend UI simulation. Terminal input uses a strict command allowlist; no shell, `eval`, filesystem, or arbitrary code execution.
- Desktop supports app opening, focus and z-order, drag, resize, minimize/restore, maximize, close and dock indicators. Mobile uses full-screen panels and touch-friendly app navigation.
- Resume is intentionally an unavailable state until the real PDF is supplied.
