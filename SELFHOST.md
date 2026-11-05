# nowjon/habitica

Fork of [awinterstein/habitica](https://github.com/awinterstein/habitica) for the best-villamil.com homelab.

- Image: `ghcr.io/nowjon/habitica:main` (Dockerfile `server` target)
- CI: `.github/workflows/build-and-deploy.yml` builds on GitHub-hosted runners, then deploys from the **self-hosted** `vm-agent-habitica` runner (labels `homelab,habitica-deploy`) over SSH via Aristaeus → vm-apps
- Deploy stack path on vm-apps: `/opt/stacks/habitica` (managed by homelab-ops Ansible role `habitica`)

## Secrets / vars

| Name | Where | Purpose |
|------|-------|---------|
| `DEPLOY_SSH_KEY` | Actions secret | Private key for `ubuntu@vm-apps` (and jump on Aristaeus) |
| `DEPLOY_HOST` | Actions secret | `10.2.2.20` (vm-apps LAN) |
| `DEPLOY_JUMP` | Actions secret | `100.96.145.104` (Aristaeus Tailscale) |
| `DEPLOY_USER` | Actions secret | `ubuntu` |
| `HABITICA_DEPLOY_ENABLED` | Actions variable | Set to `true` after the stack exists |

`TS_AUTHKEY` is unused by the current deploy path (kept only if you re-enable github-hosted Tailscale deploy).

## Customize

Branch from `main`, open a PR, merge. Image rebuild + redeploy follow automatically.
