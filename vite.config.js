import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'

// If a custom domain is configured (public/CNAME present), serve at the domain ROOT
// → base '/'. Otherwise, on GitHub Actions, serve under the repo subpath
// (https://<user>.github.io/<repo>/). Local dev always stays at root.
const hasCustomDomain = existsSync('public/CNAME')
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const base = hasCustomDomain
  ? '/'
  : process.env.GITHUB_ACTIONS && repo && !repo.endsWith('.github.io')
    ? `/${repo}/`
    : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
