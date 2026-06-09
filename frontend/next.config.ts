import type { NextConfig } from "next";

/*
  🎓 next.config.ts — updated for Next.js 16 / Turbopack

  Next.js 16 uses Turbopack as the default bundler (replacing webpack in dev).
  - In dev: Turbopack is used
  - In production build: webpack is still used

  For sql.js (WebAssembly SQLite), we only need:
    serverExternalPackages — tells Next.js to NOT bundle sql.js,
    let Node.js handle it natively. This works for both bundlers.

  The webpack fs/path fallbacks are not needed because:
    - db.ts is server-only (no "use client"), so it never runs in the browser
    - sql.js is excluded from bundling entirely via serverExternalPackages
*/
const nextConfig: NextConfig = {
  serverExternalPackages: ["sql.js"],

  // Empty turbopack config silences the "no turbopack config" warning
  // while keeping all Turbopack defaults (which work fine for us)
  turbopack: {},
};

export default nextConfig;
