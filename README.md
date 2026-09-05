# Scholarship Eligibility Portal

## Start it locally

1. Install [Node.js LTS](https://nodejs.org/).
2. In VS Code, open a terminal in this folder.
3. Run `npm install --cache .npm-cache`, then `npm run install:all`.
4. Run `npm run dev`.
5. Open the address shown for the client, usually `http://localhost:5173`.

The server creates a local SQLite database (`server/scholarships.db`) and demo data automatically on its first start. No separate database installation is needed. The `--cache .npm-cache` part avoids a Windows permission problem that can occur with the shared npm cache.

## Demo accounts

- Student: `student@example.com` / `Password123!`
- Administrator: `admin@example.com` / `Password123!`

## Checks

- Run the eligibility-engine tests: `npm test`
- Create a production frontend build: `npm run build --prefix client`

The portal provides deterministic rule-by-rule eligibility explanations, a profile form, scholarship directory, checklist, role-protected administrator view, and five seeded demo scholarships. The original-notice URLs are intentionally example.org placeholders; replace them in a real deployment.
