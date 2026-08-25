# Dependency Security and Update Audit

The dependency audit was run against the current pnpm lockfile and npm advisory registry on **25 Aug 2026**. The starting audit contained **three high** and **one low** advisory; the post-update audit reports **zero** vulnerabilities across 716 resolved dependencies.

| Finding | Initial resolved version and path | Risk | Remediation applied |
|---|---|---|---|
| `fast-uri` — host confusion | `3.1.4` via `lib/api-spec → orval → @scalar/openapi-parser → ajv` | High; parser/consumer URL host disagreement. | Root override to `3.1.6` (patched line begins at `3.1.5`). |
| `brace-expansion` — resource exhaustion | `5.0.8` via `lib/api-spec → orval → typedoc → minimatch` | High; unbounded intermediate expansion can exhaust memory or block CPU on untrusted patterns. | Root override to `5.0.9`. |
| `js-yaml` — quadratic `!!omap` resolution | `4.3.0` via `lib/api-spec → orval` | High; malicious YAML can stall the Node event loop. | Root override to `4.3.1`, the registry-recommended patched release. |
| `esbuild` — Windows dev-server traversal | `0.27.3` via Vite, TSX, Drizzle Kit, and build tooling | Low; applies to Windows `servedir`, not RentFLO’s Linux/Railway production runtime. | Root override to current patched `0.28.2`. |

The overrides are intentionally narrow and retained in `pnpm-workspace.yaml`; they update every affected transitive path without forcing a framework migration. The existing one-day `minimumReleaseAge` supply-chain safeguard remains enabled.

## Safe updates applied

| Package | Before | After | Rationale |
|---|---:|---:|---|
| `@tanstack/react-query` | `5.101.4` | `5.102.2` | Compatible patch update within the installed v5 line. |
| `@replit/vite-plugin-runtime-error-modal` | `0.0.3` | `0.0.6` | Small development-only update; the plugin is already excluded from production builds. |
| `esbuild` resolution | `0.27.3` | `0.28.2` | Advisory remediation and current patch in the target line. |

## Outdated packages deferred for manual review

The following direct packages were outdated, but no bulk major update was applied because they can require code changes, peer-dependency alignment, or visual regression testing.

| Upgrade group | Deferred packages | Why manual review is needed |
|---|---|---|
| React platform | `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react` | React 18 → 19 and the matching plugin/type updates should be migrated and UI-tested together. |
| Build and CSS platform | `vite`, `tailwindcss`, `typescript`, `@types/node`, `@replit/vite-plugin-cartographer` | Major build-tool/compiler changes can affect configuration, generated CSS, supported Node versions, and deployment output. |
| Form/schema/data layer | `@hookform/resolvers`, `zod`, `zod-validation-error`, `drizzle-zod` | Zod v4 and related resolver/error packages have API and type-level migration implications. |
| Visual components | `framer-motion`, `react-day-picker`, `react-resizable-panels`, `recharts`, `tailwind-merge`, `lucide-react` | New major component APIs may change layouts or interaction behavior. **Recharts 2.15.4 is deprecated**; v3 should be scheduled for focused migration and chart regression testing. |
| Server and utility SDKs | `date-fns`, `dotenv`, `nanoid`, `openai`, `p-retry` | Each has a newer major line; OpenAI v7 and dotenv v17 in particular warrant API/runtime compatibility testing before use in production. |

No additional direct package was marked deprecated by the registry; `recharts` was the only deprecation warning emitted during install. `pnpm outdated` still reports the groups above, and no update was silently skipped for a known vulnerability.

## Verification

Run `pnpm exec tsx scripts/verify-dependency-security.ts` to query the advisory registry again and confirm that the lockfile still resolves the four patched transitive packages plus the two conservative direct updates. Run the production build and application verification suite after any dependency update.

## References

1. [GHSA-g7r4-m6w7-qqqr — esbuild development server path traversal](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr)
2. [GHSA-7p8r-x3mc-p8w7 — fast-uri host confusion](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7)
3. [GHSA-rgw5-rvv9-x895 — brace-expansion denial of service](https://github.com/advisories/GHSA-rgw5-rvv9-x895)
4. [GHSA-5p4m-2wfm-xmqj — js-yaml quadratic `!!omap` resolution](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj)
