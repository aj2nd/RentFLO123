# Production Debug and Artifact Exposure Audit

RentFLO’s production runtime and build pipeline were audited for **debug-mode behavior, source maps, public Git metadata, and development-file paths**.

| Surface | Finding before this change | Protection now applied |
|---|---|---|
| Production runtime | `npm start` already set `NODE_ENV=production`, and the server bundle defines the same value. Vite middleware is loaded only outside production. | Preserved and verified. The server additionally disables `X-Powered-By` to avoid advertising Express. |
| Client debug overlay | The Replit runtime error overlay plugin was included in Vite configuration without an explicit production guard. | It now loads only when `NODE_ENV` is not production. Production bundles do not include the debug overlay path. |
| Client source maps | Vite’s default did not emit source maps, but the setting was implicit. | `build.sourcemap: false` is explicit. |
| Server source maps | esbuild did not request source maps, but the setting was implicit. | `sourcemap: false` and `sourcesContent: false` are explicit. |
| Production build artifact scan | No `.map` or `.git` artifact was found in the current `dist` directory. | Repeatable verification now fails if any source map, Git path, or `sourceMappingURL` reference appears in `dist`. |
| `/.git/*`, `*.map`, `.env*`, and Vite paths | The SPA fallback answered unknown routes with `index.html` and `200`, including probe paths. It did not disclose Git data, but it was not an explicit denial. | A production-static middleware now returns `404`, `no-store`, and plain `Not found` before static/SPA fallback for repository, map, environment, and Vite paths. |

## Live production findings

The live check of `https://rentflo.in` before this change was deployed returned the SPA HTML with `200` for `/.git/HEAD`, `/.git/config`, source-map probe paths, `vite.config.ts`, and `@vite/client`. The response body was the normal public shell—not Git data, source-map JSON, or development code—but the ambiguous `200` response is now removed by the explicit denial middleware.

The local production verifier confirms these paths return a genuine `404` with `Cache-Control: no-store`; normal asset and Android App Links paths still pass through. The new behavior becomes publicly visible after Railway deploys the pushed commit.

## Remaining exposure status

No production `.map` file, `sourceMappingURL` reference, tracked Git metadata path, or active Vite development middleware was found. Application logs remain available only to the Railway process logs; they are not sent in HTTP error responses. Production errors return generic messages through the existing error handler.

Run `pnpm exec tsx scripts/verify-production-exposure.ts` after changes to Vite, esbuild, static serving, or deployment packaging. It verifies production build output, debug-plugin gating, source-map absence, sensitive-route 404 behavior, and header disclosure removal.
