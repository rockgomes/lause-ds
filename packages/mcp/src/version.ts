/**
 * The package version, as a source constant rather than a runtime read of
 * `../package.json`: after esbuild bundles the Netlify function there is no
 * `../package.json` next to the bundled module, so the `createRequire` this
 * replaces threw on cold start. `version.test.ts` fails if this constant
 * drifts from `packages/mcp/package.json`, so a version bump cannot ship
 * without updating it.
 */
export const VERSION = '0.1.6';
