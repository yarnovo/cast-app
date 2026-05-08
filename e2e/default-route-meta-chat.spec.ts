import { test, expect, request as playwrightRequest } from '@playwright/test'

/**
 * e2e · 默认路由 / 直接进 跟阿空小造的对话页 (REQ-004)
 *
 * 验证:
 *   1. 打开 / · 直接看到 chat-header (ChatPage 默认 agent_id=ag_builtin_meta-xiaozao)
 *   2. session_id 自动生成 · sessionStorage(`cast_session`) + url query (`?s=`)
 *   3. INTRO 在 (assistant 自介)
 *   4. 同 session 连发 2 条 · cast-agents 真续上 (暗号 turn 2 验)
 *   5. BottomNav 在 · 没 ➕ 号 · 含 4 个 tab (对话 / 市集 / 消息 / 我)
 *   6. 重开按钮: session_id 换新 + history 清
 *
 * 网络: page.route 拦截 + APIRequestContext server-to-server 真调 prod cast-agents
 */

const AGENTS_HOST = 'api.cast-agents.agentaily.com'
const META_AGENT_ID = 'ag_builtin_meta-xiaozao'
const SECRET = '橘子皮泡水喝'

test('/ 默认 → 跟阿空小造对话 · 多轮真续上 + BottomNav 4 tab 无 ➕', async ({ page }) => {
  const apiCtx = await playwrightRequest.newContext()
  const seen: { url: string; body: unknown }[] = []
  await page.route(`**://${AGENTS_HOST}/**`, async (route) => {
    const req = route.request()
    const url = req.url()
    const postData = req.postData()
    if (url.includes('/api/agent/run') && postData) {
      try {
        seen.push({ url, body: JSON.parse(postData) })
      } catch {
        // ignore
      }
    }
    const r = await apiCtx.fetch(url, {
      method: req.method(),
      headers: req.headers(),
      data: postData ?? undefined,
      timeout: 60_000,
    })
    await route.fulfill({
      status: r.status(),
      headers: r.headers(),
      body: await r.body(),
    })
  })

  // 1. 进 / · 直接渲 ChatPage (chat-header + INTRO)
  await page.goto('/')
  await expect(page.getByTestId('chat-header')).toBeVisible()
  await expect(page.getByTestId('chat-agent-name')).toContainText('阿空小造')
  await expect(page.getByTestId('user-avatar')).toBeVisible()
  await expect(page.getByTestId('restart-btn')).toBeVisible()

  // 2. session_id 自动生成 + url query 同步 + sessionStorage 落
  await expect(page.getByTestId('session-indicator')).toContainText('会话 s_')
  const url1 = new URL(page.url())
  const sid1 = url1.searchParams.get('s')
  expect(sid1, 'session_id 落 url query').toMatch(/^s_[a-z0-9]{12}$/)
  const stored = await page.evaluate(() => sessionStorage.getItem('cast_session'))
  expect(stored).toBe(sid1)

  // 3. INTRO 在 (assistant)
  await expect(page.getByTestId('bubble-0')).toContainText('阿空小造')

  // 4. BottomNav 在 · 4 tab (对话 / 市集 / 消息 / 我) · 不含 ➕ 号 / 创建按钮
  // 注: BottomNav primary 项 label 会作为 aria-label 不渲染可见文字 · 用 role=tab 选
  await expect(page.getByRole('navigation', { name: '底部导航' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '对话' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '市集' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '消息' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '我' })).toBeVisible()
  // 没 ➕ 创建按钮 (老 BottomNav 中间项已砍 · 也不能有任何 "/create" 跳转)
  await expect(page.getByRole('tab', { name: /创建|造一个|去造|^\+$/ })).toHaveCount(0)

  // 5. 第 1 轮: 留个暗号
  const turn1 = `请记住这个暗号: ${SECRET} · 我先不造角色 · 等会儿问你`
  await page.getByTestId('ak-chat-input-textarea').fill(turn1)
  await page.getByTestId('ak-chat-input-send').click()
  await expect(page.getByTestId('bubble-1')).toContainText(SECRET)
  await expect(page.getByTestId('bubble-2')).toBeVisible({ timeout: 60_000 })
  const reply1 = (await page.getByTestId('bubble-2').textContent()) || ''
  expect(reply1.trim().length).toBeGreaterThan(0)
  expect(reply1).not.toContain('出错了')

  // 6. 第 2 轮 (同 session): 问暗号 · LLM 应能从上一轮 history 拿到
  const turn2 = '我刚才说的暗号是啥? 一字不差给我重复一遍'
  await page.getByTestId('ak-chat-input-textarea').fill(turn2)
  await page.getByTestId('ak-chat-input-send').click()
  await expect(page.getByTestId('bubble-3')).toContainText(turn2)
  await expect(page.getByTestId('bubble-4')).toBeVisible({ timeout: 60_000 })
  const reply2 = (await page.getByTestId('bubble-4').textContent()) || ''
  expect(reply2, '第 2 轮回复应含暗号 (LLM 真续上 · session 持久化生效)').toContain(SECRET)
  expect(reply2).not.toContain('出错了')

  // 7. 验 2 轮请求都用同一个 session_id
  const runReqs = seen.filter((s) => (s.body as { agent_id?: string }).agent_id === META_AGENT_ID)
  expect(runReqs.length, '至少 2 条 /api/agent/run 请求').toBeGreaterThanOrEqual(2)
  const sids = runReqs.map((r) => (r.body as { session_id: string }).session_id)
  expect(new Set(sids).size, '所有请求同 session_id').toBe(1)
  expect(sids[0]).toBe(sid1)

  // 8. 重开: session_id 换 · history 清 · INTRO 重出
  await page.getByTestId('restart-btn').click()
  await expect(page.getByTestId('bubble-0')).toContainText('阿空小造')
  await expect(page.getByTestId('bubble-1')).not.toBeVisible()
  const url3 = new URL(page.url())
  const sid2 = url3.searchParams.get('s')
  expect(sid2).toMatch(/^s_[a-z0-9]{12}$/)
  expect(sid2, '重开后 session_id 必须换').not.toBe(sid1)
})
