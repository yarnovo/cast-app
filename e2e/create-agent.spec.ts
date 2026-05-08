import { test, expect, request as playwrightRequest } from '@playwright/test'

/**
 * e2e · 真人造 agent 全链路
 *
 * 验证: cast-app /create → 用户输入 → cast-agents /api/agent/tick → meta-xiaozao LLM → 返 reply 渲染
 *
 * 不 mock · 真调线上 LLM · 老板"用户场景" 视角:
 *   1. 进 /create
 *   2. 看到第 1 条 INTRO (assistant 自介)
 *   3. 输入 "你好" 发送
 *   4. user 气泡出现
 *   5. 等 LLM (≤60s) · assistant 回复非空气泡
 *
 * 网络处理: prod cast-agents CORS 仅允许 m.cast.agentaily.com origin · 本地 preview origin
 * 是 localhost:4173 触发 CORS 拒绝。所以走 page.route 拦截 → playwright APIRequestContext
 * 服务端→服务端调真 prod API (无 CORS 限制) · 把响应回给浏览器。这是 server-to-server 真调用 ·
 * 不是 mock。
 */

const AGENTS_HOST = 'api.cast-agents.agentaily.com'

test('真人造 agent · 跟阿空小造对话 · LLM 返非空回复', async ({ page }) => {
  // 拦截浏览器到 prod cast-agents 的 fetch · 用 server-to-server 真调真 LLM · 绕 CORS
  const apiCtx = await playwrightRequest.newContext()
  await page.route(`**://${AGENTS_HOST}/**`, async (route) => {
    const req = route.request()
    const r = await apiCtx.fetch(req.url(), {
      method: req.method(),
      headers: req.headers(),
      data: req.postData() ?? undefined,
      timeout: 60_000,
    })
    await route.fulfill({
      status: r.status(),
      headers: r.headers(),
      body: await r.body(),
    })
  })
  await page.goto('/create')

  // 1. 头部 ready
  await expect(page.getByTestId('create-role-header')).toContainText('角色助手')

  // 2. 第 1 条 INTRO 在 (assistant)
  await expect(page.getByTestId('bubble-0')).toContainText('你好')

  // 3. 输入 + 发送 (用 ChatInput 内置 testid)
  const textarea = page.getByTestId('ak-chat-input-textarea')
  await textarea.fill('你好')
  await page.getByTestId('ak-chat-input-send').click()

  // 4. user 气泡 (bubble-1) 立刻出现
  await expect(page.getByTestId('bubble-1')).toContainText('你好')

  // 5. assistant 回复 (bubble-2) · 等 60s 给 LLM (cold start + 推理)
  await expect(page.getByTestId('bubble-2')).toBeVisible({ timeout: 60_000 })

  const reply = await page.getByTestId('bubble-2').textContent()
  expect(reply, 'assistant 回复内容').not.toBeNull()
  expect(reply!.trim().length).toBeGreaterThan(10)

  // 不出错气泡
  expect(reply).not.toContain('出错了')
})
