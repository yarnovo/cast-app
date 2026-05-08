import { test, expect, request as playwrightRequest } from '@playwright/test'

/**
 * e2e · /create 多轮对话 session 持久化
 *
 * REQ-001 验证: 同一 session_id 连发 2 条用户消息 · cast-agents 真续上 ·
 *               LLM 第 2 轮看得到第 1 轮 (用"记忆暗号"提问验证)。
 *
 * 验收点:
 *   1. session_id 自动生成 + url query (`?s=...`) + sessionStorage 持久化
 *   2. 同 session_id POST /api/agent/run · 2 轮真过 (网络层 server-to-server fetch 拦截)
 *   3. 第 2 轮 final_text 包含第 1 轮提到的暗号 (LLM 看到了上下文)
 *   4. 重开按钮: 清 session + 生新 session_id + 清 history → INTRO 重出
 */

const AGENTS_HOST = 'api.cast-agents.agentaily.com'
const SECRET = '橘子皮泡水喝'

test('/create 多轮 · 同 session 真续上 · LLM 看得到上一轮暗号', async ({ page }) => {
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

  await page.goto('/create')

  // 1. session_id 自动生成 + url query 同步
  await expect(page.getByTestId('session-indicator')).toContainText('会话 s_')
  const url1 = new URL(page.url())
  const sid1 = url1.searchParams.get('s')
  expect(sid1, 'session_id 落 url query').toMatch(/^s_[a-z0-9]{12}$/)

  // sessionStorage 也持久化
  const stored = await page.evaluate(() => sessionStorage.getItem('cast_create_session'))
  expect(stored).toBe(sid1)

  // 2. 第 1 轮: 留个暗号
  const turn1 = `请记住这个暗号: ${SECRET} · 我先不造角色 · 等会儿问你`
  await page.getByTestId('ak-chat-input-textarea').fill(turn1)
  await page.getByTestId('ak-chat-input-send').click()
  await expect(page.getByTestId('bubble-1')).toContainText(SECRET)
  await expect(page.getByTestId('bubble-2')).toBeVisible({ timeout: 60_000 })
  const reply1 = (await page.getByTestId('bubble-2').textContent()) || ''
  expect(reply1.trim().length).toBeGreaterThan(0)
  expect(reply1).not.toContain('出错了')

  // 3. 第 2 轮 (同 session): 问暗号 · LLM 应能从上一轮 history 拿到
  const turn2 = '我刚才说的暗号是啥? 一字不差给我重复一遍'
  await page.getByTestId('ak-chat-input-textarea').fill(turn2)
  await page.getByTestId('ak-chat-input-send').click()
  await expect(page.getByTestId('bubble-3')).toContainText(turn2)
  await expect(page.getByTestId('bubble-4')).toBeVisible({ timeout: 60_000 })
  const reply2 = (await page.getByTestId('bubble-4').textContent()) || ''

  // 关键断言: LLM 第 2 轮真看到了第 1 轮的暗号
  expect(reply2, '第 2 轮回复应含暗号 (LLM 真续上 · session 持久化生效)').toContain(SECRET)
  expect(reply2).not.toContain('出错了')

  // 4. 验 2 轮请求都用同一个 session_id (server-side 真续)
  const runReqs = seen.filter((s) => (s.body as { agent_id?: string }).agent_id)
  expect(runReqs.length, '至少 2 条 /api/agent/run 请求').toBeGreaterThanOrEqual(2)
  const sids = runReqs.map((r) => (r.body as { session_id: string }).session_id)
  expect(new Set(sids).size, '所有请求同 session_id').toBe(1)
  expect(sids[0]).toBe(sid1)

  // 5. session_id 跨刷新不丢
  await page.reload()
  await expect(page.getByTestId('session-indicator')).toContainText(sid1!.slice(0, 8))
  const url2 = new URL(page.url())
  expect(url2.searchParams.get('s')).toBe(sid1)

  // 6. 重开按钮: 生新 session_id + 清 history (INTRO 重出 · turn1/2 消失)
  await page.getByTestId('restart-btn').click()
  await expect(page.getByTestId('bubble-0')).toContainText('你好')
  await expect(page.getByTestId('bubble-1')).not.toBeVisible()
  const url3 = new URL(page.url())
  const sid2 = url3.searchParams.get('s')
  expect(sid2).toMatch(/^s_[a-z0-9]{12}$/)
  expect(sid2, '重开后 session_id 必须换').not.toBe(sid1)
})
