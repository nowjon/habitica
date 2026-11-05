# nowjon/habitica

Fork of [awinterstein/habitica](https://github.com/awinterstein/habitica) for the best-villamil.com homelab.

- Image: `ghcr.io/nowjon/habitica:main` (Dockerfile `server` target)
- CI: `.github/workflows/build-and-deploy.yml` builds on merge to `main` and, when `HABITICA_DEPLOY_ENABLED=true`, SSHes over Tailscale to vm-apps to `docker compose pull && up -d`
- Deploy stack path on vm-apps: `/opt/stacks/habitica` (managed by homelab-ops Ansible role `habitica`)

## Secrets / vars

| Name | Where | Purpose |
|------|-------|---------|
| `TS_AUTHKEY` | Actions secret | Tailscale auth key (reusable) for the CI runner |
| `DEPLOY_SSH_KEY` | Actions secret | Private key for `ubuntu@vm-apps` |
| `DEPLOY_HOST` | Actions secret | Tailscale IP or MagicDNS for vm-apps |
| `DEPLOY_USER` | Actions secret | `ubuntu` |
| `HABITICA_DEPLOY_ENABLED` | Actions variable | Set to `true` after the stack exists |

## Customize

Branch from `main`, open a PR, merge. Image rebuild + redeploy follow automatically.
