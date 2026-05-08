import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright e2e 配置 · cast-app
 *
 * 默认: 跑本地 vite preview (基于 prod build · 已 inline prod API URL · 含本地新加 testid)
 *       这样测的是带 testid 的最新前端 + 真 prod cast-agents API
 *
 * 显式 prod 端到端: E2E_BASE_URL=https://m.cast.agentaily.com npm run test:e2e
 *       (前提: 当前 testid 已部署上 prod · 否则用 default 模式)
 *
 * - 单 chromium · 不并行 · 不 retry (老板规约 · 要么过要么真错)
 * - 60s timeout (LLM cold start + 推理)
 */
const useProd = !!process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: useProd
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --port 4173 --strictPort',
        url: 'http://localhost:4173',
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
