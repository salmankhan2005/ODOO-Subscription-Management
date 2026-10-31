<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/86797d96-1f71-4209-a924-9b88b295d4aa

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Authentication

The application uses one sign-in page for administrator, staff, and customer
accounts. After the backend authenticates an account, its profile role selects
the corresponding workspace. Customers can register from the same page;
administrator and staff accounts are provisioned by an administrator.

Authentication tokens are kept in tab-scoped `sessionStorage`, not shared
`localStorage`, so separate browser tabs and browser profiles maintain separate
sessions. A tab can keep multiple authenticated accounts; use the account menu
to add an account or switch between saved accounts. The selected account's
dashboard is restored when the host URL is reopened in that tab. On reload and
account switches, the app verifies the selected session with the backend before
rendering its workspace. Backend role checks and customer ownership checks
remain the authority for API access.
