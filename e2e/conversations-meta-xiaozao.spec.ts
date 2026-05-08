import { test, expect, request as playwrightRequest } from '@playwright/test'

/**
 * e2e · 阿空小造在聊天列表置顶 + 单聊天页多轮对话
 *
 * REQ-002 验证:
 *   1. /messages 列表顶部出现 pinned-meta-xiaozao 项 · 不可删除 (没删除按钮)
 *   2. 点进去 → /messages/ag_builtin_meta-xiaozao · 渲染 conversation-header
 *   3. session_id 跨刷新 / 跨页持久化 (sessionStorage key=`cast_session:${agentId}:${userId}`)
 *   4. 同 session 连发 2 条 · cast-agents 真续上 (暗号 turn 2 验)
 *   5. 重开按钮: session_id 换新 + history 清
 *
 * 网络: page.route 拦截 + APIRequestContext server-to-server 真调 prod cast-agents
 *      (CORS 允许 m.cast.agentaily.com origin · 本地 localhost:4173 走拦截)
 */

const AGENTS_HOST = 'api.cast-agents.agentaily.com'
const META_AGENT_ID = 'ag_builtin_meta-xiaozao'
const SECRET = '橘子皮泡水喝'

test('阿空小造 · 聊天列表置顶 → 单聊天页多轮真续上', async ({ page }) => {
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

  // 1. /messages 列表 · pinned-meta-xiaozao 在
  // 注: 走 / + BottomNav 点击 (用户真实路径) · 不直接 goto('/messages') —
  // OSS 静态托管 SPA 子路由需 error_doc=index.html · 当前 staging/prod bucket 暂无此设置 ·
  // 用户用 BottomNav 走 client-side routing 没问题。
  await page.goto('/')
  await page.getByText('消息', { exact: true }).click()
  const pinned = page.getByTestId('pinned-meta-xiaozao')
  await expect(pinned).toBeVisible()
  await expect(pinned).toContainText('阿空小造')
  await expect(pinned).toContainText('帮你打造你的 AI 角色')
  // 置顶标识
  await expect(page.getByTestId('pin-indicator')).toBeVisible()
  // 不可删除: 没删除按钮 (用 role/text 双重保险)
  await expect(page.getByRole('button', { name: '删除' })).toHaveCount(0)
  await expect(page.getByText('删除会话')).toHaveCount(0)

  // 2. 点进置顶 → /messages/<meta-id>
  await pinned.click()
  await expect(page).toHaveURL(new RegExp(`/messages/${META_AGENT_ID}$`))
  await expect(page.getByTestId('conversation-header')).toBeVisible()
  await expect(page.getByTestId('conversation-agent-name')).toContainText('阿空小造')
  await expect(page.getByTestId('session-indicator')).toContainText('会话 s_')
  await expect(page.getByTestId('bubble-0')).toContainText('阿空小造')

  // 3. session_id 持久化到 sessionStorage (key=`cast_session:${agentId}:${userId}`)
  const sid1 = await page.evaluate((agentId) => {
    const userId = localStorage.getItem('cast_owner') || 'u01'
    return sessionStorage.getItem(`cast_session:${agentId}:${userId}`)
  }, META_AGENT_ID)
  expect(sid1, 'session_id 落 sessionStorage').toMatch(/^s_[a-z0-9]{12}$/)

  // 4. 第 1 轮: 留暗号
  const turn1 = `请记住这个暗号: ${SECRET} · 我先不造角色 · 等会儿问你`
  await page.getByTestId('ak-chat-input-textarea').fill(turn1)
  await page.getByTestId('ak-chat-input-send').click()
  await expect(page.getByTestId('bubble-1')).toContainText(SECRET)
  await expect(page.getByTestId('bubble-2')).toBeVisible({ timeout: 60_000 })
  const reply1 = (await page.getByTestId('bubble-2').textContent()) || ''
  expect(reply1.trim().length).toBeGreaterThan(0)
  expect(reply1).not.toContain('出错了')

  // 5. 第 2 轮: 问暗号 · LLM 应能从上一轮 history 拿到
  const turn2 = '我刚才说的暗号是啥? 一字不差给我重复一遍'
  await page.getByTestId('ak-chat-input-textarea').fill(turn2)
  await page.getByTestId('ak-chat-input-send').click()
  await expect(page.getByTestId('bubble-3')).toContainText(turn2)
  await expect(page.getByTestId('bubble-4')).toBeVisible({ timeout: 60_000 })
  const reply2 = (await page.getByTestId('bubble-4').textContent()) || ''
  expect(reply2, '第 2 轮回复应含暗号 (LLM 真续上 · session 持久化生效)').toContain(SECRET)
  expect(reply2).not.toContain('出错了')

  // 6. 验 2 轮请求都用同一个 session_id
  const runReqs = seen.filter((s) => (s.body as { agent_id?: string }).agent_id === META_AGENT_ID)
  expect(runReqs.length, '至少 2 条 /api/agent/run 请求').toBeGreaterThanOrEqual(2)
  const sids = runReqs.map((r) => (r.body as { session_id: string }).session_id)
  expect(new Set(sids).size, '所有请求同 session_id').toBe(1)
  expect(sids[0]).toBe(sid1)

  // 7. session_id 跨页持久化 (回 / · 重新点 BottomNav + pinned · 应续上同 sid)
  // 注: 不用 page.reload() · OSS 静态托管 SPA 子路由 (`/messages/:agentId`) 直接 reload 会 404
  await page.goto('/')
  await page.getByText('消息', { exact: true }).click()
  await page.getByTestId('pinned-meta-xiaozao').click()
  await expect(page.getByTestId('session-indicator')).toContainText(sid1!.slice(0, 8))

  // 8. 重开: session_id 换 · history 清 (INTRO 重出 · turn1/2 消失)
  await page.getByTestId('restart-btn').click()
  await expect(page.getByTestId('bubble-0')).toContainText('阿空小造')
  await expect(page.getByTestId('bubble-1')).not.toBeVisible()
  const sid2 = await page.evaluate((agentId) => {
    const userId = localStorage.getItem('cast_owner') || 'u01'
    return sessionStorage.getItem(`cast_session:${agentId}:${userId}`)
  }, META_AGENT_ID)
  expect(sid2).toMatch(/^s_[a-z0-9]{12}$/)
  expect(sid2, '重开后 session_id 必须换').not.toBe(sid1)
})
