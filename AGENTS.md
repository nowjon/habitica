# Agent instructions (nowjon/habitica)

Homelab Habitica for **best-villamil.com**. Live site: https://habitica.best-villamil.com

## Required close-out after feature work

When a feature/fix is ready, do **all** of the following before ending the session. Do not stop at opening a PR.

1. **Open/update the PR** for the feature branch (use `ManagePullRequest`).
2. **Auto-merge** into `main` once the change is ready (prefer `gh pr merge <n> --squash --delete-branch`).
3. **Confirm deploy**: wait for the `Build and Deploy` workflow on `main` (`build-and-push` + `deploy`) to succeed. Prefer `cursor-subscriptions` CI subscription over polling.
4. **Confirm the site is up**:
   - `GET https://habitica.best-villamil.com/api/v3/status` → `{"success":true,"data":{"status":"up"},...}`
   - Homepage `https://habitica.best-villamil.com/` → HTTP 200
5. **Confirm image prune ran**: after a healthy recreate, the deploy job removes unused `ghcr.io/nowjon/habitica` images on vm-apps (by image ID; Docker’s `image prune` has no `reference` filter) and prunes dangling layers. Check the deploy log for `habitica image prune complete`.
6. **Report** merge link, deploy run link, site health, and prune confirmation in the user-facing summary.

## Deploy reference

- Workflow: `.github/workflows/build-and-deploy.yml` (push to `main` / `workflow_dispatch`)
- Image: `ghcr.io/nowjon/habitica:main`
- Stack on vm-apps: `/opt/stacks/habitica`
- In-cluster health during deploy: `http://127.0.0.1:3070/api/v3/status`
- More ops detail: `SELFHOST.md`

## Notes

- Prefer squash-merge unless the user asks otherwise.
- If CI fails, diagnose and fix; do not leave a broken `main` deploy unaddressed.
- New locale keys require a full deploy (i18n cache is baked into the image). Hard-refresh guidance only if a stale browser cache of `/api/v4/i18n/core` is suspected; production already uses `no-cache` + a build SHA query param.
