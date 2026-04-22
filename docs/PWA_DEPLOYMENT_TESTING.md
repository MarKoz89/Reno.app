# PWA Deployment Testing

## Recommended First Deployment

Use Vercel for the first real HTTPS deployment of Reno App.

Vercel is the best current fit because Reno App is a Next.js App Router MVP and needs a simple HTTPS URL for mobile PWA testing. Vercel provides automatic HTTPS, preview deployments, production deployments, and support for Next.js route handlers without adding servers, Docker, native wrappers, databases, authentication, or app store packaging.

This deployment is for testing the mobile web app and installable PWA behavior. It is not a native iOS or Android release.

## Environment Variables

Configure these in the Vercel project settings:

- `OPENAI_API_KEY` - required for AI redesign and planning insight routes.
- `OPENAI_IMAGE_MODEL` - optional image model override.
- `OPENAI_PLANNING_MODEL` - optional planning model override.

Do not commit secrets to the repository.

## Local Production Verification

Before deploying, run:

```bash
npm run build
npm run start
```

Then open:

```text
http://localhost:3000
```

Check the core flow:

- Upload
- Style
- Redesign variants
- Wizard
- Results
- Saved projects
- Report preview

The service worker registers only in production mode and on supported secure origins. `localhost` is allowed for development testing, but real mobile PWA testing should use HTTPS.

## Deploy To Vercel

1. Import the repository into Vercel.
2. Keep the default Next.js settings.
3. Add the environment variables listed above.
4. Deploy.
5. Open the HTTPS preview or production URL on desktop first.

Expected build command:

```bash
npm run build
```

Vercel handles the production runtime for the Next.js app.

## HTTPS Expectations

PWA installability and service workers require a secure origin:

- HTTPS deployment URL: supported.
- `localhost`: supported for local testing.
- Plain `http://` on a LAN IP: not reliable for service worker or install testing.

Use the Vercel HTTPS URL when testing on real Android and iPhone devices.

## PWA Verification

In desktop Chrome DevTools:

1. Open the deployed HTTPS URL.
2. Go to Application.
3. Check Manifest.
4. Confirm the app name, icons, start URL, display mode, and theme color appear.
5. Check Service Workers.
6. Confirm `/sw.js` is registered.

The service worker is intentionally conservative. It should not cache API routes or AI responses.

## Android Chrome Install Test

1. Open the Vercel HTTPS URL in Chrome on Android.
2. Open the browser menu.
3. Choose Install app or Add to Home screen.
4. Launch Reno App from the home screen icon.
5. Confirm it opens in standalone app-style mode.
6. Test the core flow:
   - Upload a room photo.
   - Choose a style.
   - Generate or handle redesign variants.
   - Complete the wizard.
   - View results.
   - Save and reopen a project.
   - Preview the report.

If install is not offered, check the manifest and service worker in desktop DevTools first.

## iPhone Safari Add To Home Screen Test

1. Open the Vercel HTTPS URL in Safari on iPhone.
2. Tap Share.
3. Tap Add to Home Screen.
4. Launch Reno App from the home screen icon.
5. Confirm the app opens from the saved icon.
6. Test the core flow:
   - Upload a room photo.
   - Choose a style.
   - Generate or handle redesign variants.
   - Complete the wizard.
   - View results.
   - Save and reopen a project.
   - Preview the report.

iOS install behavior is Safari-specific. Chrome on iOS does not provide the same PWA install path.

## AI Route Verification

After deployment, verify:

- `/api/redesign` works through the variants flow when `OPENAI_API_KEY` is configured.
- `/api/planning` works through the report planning insights section.
- Missing or invalid AI configuration shows a clear UI error instead of breaking the app.
- No AI route responses are cached by the service worker.

If AI features fail only in production, check:

- Vercel environment variables are set for the correct environment.
- The deployment was redeployed after adding variables.
- The OpenAI key is valid.
- The browser console and Vercel function logs for route errors.

## Troubleshooting Manifest Or Service Worker Cache

If mobile devices show stale PWA behavior:

1. Close all open Reno App tabs.
2. Clear site data for the deployed domain.
3. On desktop Chrome, go to Application -> Service Workers and unregister the service worker.
4. On desktop Chrome, go to Application -> Storage and clear site data.
5. Reload the deployed URL.
6. Reinstall the app on the device if needed.

If the manifest does not update immediately, wait a short time and reload the page. Browsers may cache manifest and service worker metadata more aggressively than normal page content.

## What This Deployment Is Not

This is not:

- A native iOS app.
- A native Android app.
- An App Store or Play Store release.
- Capacitor integration.
- Offline AI generation.
- Offline project sync.
- Authentication, payments, or database setup.

The goal is a practical HTTPS deployment for testing Reno App as a mobile web app and installable PWA.
