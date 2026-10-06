# buildkite-demo

A tiny Fastify service for trying out Buildkite as a replacement for GitHub Actions. The app is trivial on purpose. The pipeline in `.buildkite/pipeline.yml` is what we're evaluating.

The fee rates in `src/fees.ts` are placeholders, not real pricing.

## The app

| Route | Description |
|---|---|
| `GET /health` | `{ "status": "ok" }` |
| `POST /fees/quote` | Body `{ "amountMinor": 10000, "method": "card" \| "bank_transfer" }` returns the fee and net amount |

```sh
npm ci
npm run dev                         # tsx watch on :3000
npm run lint && npm run typecheck && npm test
npm run build && npm start
```

## What the pipeline demonstrates

| Step | Buildkite feature |
|---|---|
| Lint, Typecheck, Test | Steps with no dependencies run in parallel |
| All Node steps | `docker` plugin pins `node:22`; YAML anchor (`&node` / `*node`) reuses the plugin config |
| Pipeline-level `cache` | Hosted-agent cache volume keeps `.npm-cache` warm between builds |
| Test | `artifact_paths` uploads JUnit + HTML coverage |
| Annotate test results | `depends_on` with `allow_failure: true` so it runs even if tests fail; `buildkite-agent annotate` posts a summary to the build page |
| Flaky check | `retry.automatic` on exit status 1 (up to 2 retries), plus `soft_fail` |
| `wait` | Barrier: Build starts only after every check above has passed |
| Build | Uploads `dist/` as an artifact |
| Smoke test | `artifacts` plugin downloads `dist/` from another job; `branches: main` means it only runs on `main` |

Every step also has `timeout_in_minutes`, and global `env` is set at the top of the file.

Hosted agents start each job on a fresh machine, so `node_modules` doesn't carry over between steps. Each step runs `npm ci` against the cached npm download cache instead. Jobs in GitHub Actions work the same way.

## Connecting Buildkite

1. **Cluster and queue.** In Buildkite go to **Agents → Clusters**. Create a cluster (or use the default), then add a **Hosted** queue on **Linux** (the smallest size is enough).
2. **Pipeline.** Go to **Pipelines → New pipeline** and set:
   - Repository: `https://github.com/breeze-huizhuan/buildkite-demo` (connect your GitHub account when asked)
   - Cluster: the one from step 1
   - Steps: leave the default upload step:
     ```yaml
     steps:
       - label: ":pipeline: Upload"
         command: buildkite-agent pipeline upload
     ```
     If the cluster has more than one queue, add `agents: { queue: "<your-hosted-queue-key>" }` to that step and to the top of `.buildkite/pipeline.yml`.
3. **GitHub integration.** Under the pipeline's **Settings → GitHub**, turn on builds for pushes and pull requests and turn on commit statuses. Install the Buildkite GitHub app on the `breeze-huizhuan` account and give it access to this repo only.
4. **First build.** Click **New build** on `main`, or push a commit.

## Things to check in the Buildkite UI

- [ ] Lint, Typecheck, Test and Flaky check start at the same time
- [ ] A "Test results" annotation shows up at the top of the build
- [ ] `reports/` (JUnit, coverage) and `dist/` show up under **Artifacts**
- [ ] When Flaky check fails, it retries on its own (re-run builds until you see it happen)
- [ ] Build waits for all checks, and Smoke test downloads `dist/` and passes
- [ ] On a non-`main` branch, Smoke test is skipped
- [ ] The second build's `npm ci` is faster (cache volume hit). Cache volumes aren't guaranteed, so an occasional miss is normal.
- [ ] Break a test on a branch: Test goes red, the annotation turns red, and Build/Smoke never run
