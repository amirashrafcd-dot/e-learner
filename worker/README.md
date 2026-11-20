# e-Learner Content API (Cloudflare Worker)

This service lets the private `/control/` dashboard read and update the repository's root `data.js` file. The GitHub token is kept as a Cloudflare Worker secret and is never sent to the browser.

## 1) Create a fine-grained GitHub token

Create a fine-grained personal access token restricted to **only** the `e-learner` repository, with **Contents: Read and write**. No Actions, Workflows, or administration permission is needed. Copy it once; do not put it in this repository or in `control/config.js`.

## 2) Create the Cloudflare Worker

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Create a Worker named `e-learner-content-api`.
3. Upload/deploy the contents of `worker/src/index.js` as the Worker entry point (or deploy this folder using Wrangler).
4. In Worker **Settings → Variables and Secrets**, add these as **Secrets**:
   - `ADMIN_PASSWORD`: use a long, unique password (at least 24 random characters).
   - `GITHUB_TOKEN`: the fine-grained token created above.
5. Add the non-secret variables from `wrangler.toml` if you did not deploy with Wrangler:
   - `GITHUB_OWNER=amirashrafcd-dot`
   - `GITHUB_REPO=e-learner`
   - `GITHUB_BRANCH=main`
   - `ALLOWED_ORIGIN=https://amirashrafcd-dot.github.io`
6. Deploy the Worker and copy its `https://...workers.dev` URL.

Cloudflare secrets are encrypted and exposed to Worker code through its environment; never put these values in public JavaScript. See [Cloudflare secrets documentation](https://developers.cloudflare.com/workers/configuration/secrets/).

## 3) Connect the private dashboard

Open `control/config.js` and replace the placeholder with the deployed Worker URL:

```js
window.EL_ADMIN_API = "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev";
```

Commit this file. Do not add the admin password or GitHub token here.

## 4) Use it

Open the unlisted page `https://amirashrafcd-dot.github.io/e-learner/control/`, enter `ADMIN_PASSWORD`, then add/edit/delete a book or other resource. Saving updates `data.js` through GitHub's Contents API, creates a Git commit, and GitHub Pages rebuilds the public site. No data.js download/upload is needed.

The dashboard is intentionally not linked from the public navigation/footer and uses `noindex,nofollow`. **An unlisted URL is not security by itself**: security comes from the Worker password check and server-side token. Use a unique password and rotate it if it is exposed. For additional protection, add Cloudflare rate limiting to `/api/*` and consider Cloudflare Access for the dashboard.

## Important limits

- This edits the resource catalogue (`data.js`) and its Google Drive/external links. It does not upload PDF files into Drive. Upload the actual PDF to a Drive folder you control, set sharing appropriately, then paste its share link into the dashboard.
- The API is restricted to the GitHub Pages site origin and validates the admin password on every request. The GitHub token never leaves Cloudflare.
- GitHub's Contents API requires `Contents: write` for the fine-grained token and a current file SHA when updating an existing file. If another edit happens concurrently, reload the dashboard before retrying.
