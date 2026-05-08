/** Cast API client · 接 cast-agents (api.cast-agents.agentaily.com · 公司主域 agentaily.com 子域)
 *
 * REQ-003 (5-9) 砍 cast-app 到单页对话后 · 前端不再直接调 cast-api 业务 endpoint
 * (用户/角色/订单/服务包) · 所有数据查询 / 修改一律通过跟阿空小造对话 · meta agent 调对应 tool。
 * 所以这个 client 只剩一个 helper: agentRun() · 走 cast-agents `/api/agent/run`。
 */

const AGENTS_BASE = (import.meta.env.VITE_AGENTS_BASE_URL ?? '').replace(/\/$/, '')

export type RunMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: unknown
}

export type RunUsage = {
  input_tokens?: number
  output_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

export type TickAction = {
  tool_id: string
  args: Record<string, unknown>
  result: unknown
}

export type RunResult = {
  messages: RunMessage[]
  final_text: string
  stop_reason: 'end_turn' | 'max_turns' | 'harness_stop'
  turns_used: number
  usage: RunUsage
  actions: TickAction[]
}

async function agentReq<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${AGENTS_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return (await r.json()) as T
}

export const api = {
  /**
   * agent run · sync 多轮 session-持久化 (架构 §2.7)
   * session_id 前端自生 · 同 session_id 反复 POST · cast-agents 内部 RdsSession.load 续上下文
   */
  agentRun: (params: {
    agentId: string
    sessionId: string
    userMessage: string
    maxTurns?: number
  }) =>
    agentReq<RunResult>('/api/agent/run', {
      method: 'POST',
      body: JSON.stringify({
        agent_id: params.agentId,
        session_id: params.sessionId,
        user_message: params.userMessage,
        max_turns: params.maxTurns ?? 10,
      }),
    }),
}
