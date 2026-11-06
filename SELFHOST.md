# nowjon/habitica

Fork of [awinterstein/habitica](https://github.com/awinterstein/habitica) for the best-villamil.com homelab.

- Image: `ghcr.io/nowjon/habitica:main` (Dockerfile `server` target)
- CI: `.github/workflows/build-and-deploy.yml` builds on GitHub-hosted runners, then deploys from the **self-hosted** `vm-agent-habitica` runner (labels `homelab,habitica-deploy`) over SSH via Aristaeus → vm-apps
- Deploy stack path on vm-apps: `/opt/stacks/habitica` (managed by homelab-ops Ansible role `habitica`)
- Public URL: https://habitica.best-villamil.com
- Status: https://habitica.best-villamil.com/api/v3/status

## Secrets / vars

| Name | Where | Purpose |
|------|-------|---------|
| `DEPLOY_SSH_KEY` | Actions secret | Private key for `ubuntu@vm-apps` (and jump on Aristaeus) |
| `DEPLOY_HOST` | Actions secret | `10.2.2.20` (vm-apps LAN) |
| `DEPLOY_JUMP` | Actions secret | `100.96.145.104` (Aristaeus Tailscale) |
| `DEPLOY_USER` | Actions secret | `ubuntu` |
| `HABITICA_DEPLOY_ENABLED` | Actions variable | Set to `true` after the stack exists |

`TS_AUTHKEY` is unused by the current deploy path (kept only if you re-enable github-hosted Tailscale deploy).

## Customize / agent close-out

Branch from `main`, open a PR, **auto-merge** when ready. Image rebuild + redeploy follow automatically.

Agents (see `AGENTS.md` and `.cursor/rules/post-merge-deploy.mdc`) must complete this loop every time:

1. Squash-merge the PR into `main`
2. Confirm `Build and Deploy` succeeds on `main`
3. Confirm https://habitica.best-villamil.com is up (`/api/v3/status` → `up`)
4. Confirm unused Habitica images were pruned on vm-apps (deploy job runs `docker image prune` for `ghcr.io/nowjon/habitica*`)

### Deploy steps on vm-apps (summary)

1. `docker compose pull` + `up -d --force-recreate server` in `/opt/stacks/habitica`
2. Poll `http://127.0.0.1:3070/api/v3/status` until healthy
3. Prune unused `ghcr.io/nowjon/habitica*` images
