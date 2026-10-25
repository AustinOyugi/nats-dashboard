# Fork image publishing

This fork retains the upstream dashboard's behavior and adds visible JetStream subjects and stream filtering.
Upstream contribution: https://github.com/mdawar/nats-dashboard/pull/13.

The fork-only `Publish fork image` workflow runs on `main` pushes or manual dispatch. It installs locked
dependencies, runs the tests, and builds the existing Dockerfile for Linux amd64 and arm64. The Docker
build also runs the Astro/TypeScript checks and production build. No Docker Hub or Cloudflare secrets
are needed: registry authentication uses the job-scoped `GITHUB_TOKEN` with package write permission.

Images are published as `ghcr.io/austinoyugi/nats-dashboard:sha-<full-commit-sha>`. The workflow summary
reports the immutable digest reference. Deploy `ghcr.io/austinoyugi/nats-dashboard@sha256:<digest>`
to pin the exact build instead of following a mutable `latest` tag.

The registry package must be public for anonymous pulls by the Noops Swarm hosts. Confirm an anonymous
pull resolves before updating infrastructure. Keep the existing runtime config mount at `/srv/config.json`
and `REVERSE_PROXY_UPSTREAM` environment setting. Dashboard updates do not require broker changes.

Publishing changes are kept on the fork's main branch; the upstream PR's feature branch remains separate.
