/** Cast API client · 接 cast-api (api.cast.agentaily.com · 公司主域 agentaily.com 子域) */

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const AGENTS_BASE = (import.meta.env.VITE_AGENTS_BASE_URL ?? '').replace(/\/$/, '')

export type User = {
  id: string
  name: string
  avatar: string
  bio: string
}

export type ServicePublic = {
  id: number
  agent_id: string
  title: string
  description: string
  price_cents: number
  sla_hours: number
  mode: 'ai' | 'human' | 'hybrid'
  enabled: boolean
}

export type RoleSummary = {
  id: string
  name: string
  tagline: string
  persona: User
  starting_price_cents: number | null
  services_count: number
  status: string
}

export type RoleDetail = RoleSummary & {
  soul: string
  playbook: string
  style: string
  expertise: string
  owner_id: string
  services: ServicePublic[]
  created_at: string
}

export type OrderPublic = {
  id: string
  buyer_id: string
  agent_id: string
  service_id: number
  price_cents: number
  status: string
  requirements: string
  deliverables: string
  created_at: string
  paid_at: string | null
  delivered_at: string | null
}

export type Trigger = {
  kind: 'cron' | 'event' | 'human-dm' | 'manual'
  payload?: Record<string, unknown>
}

export type TickAction = {
  tool_id: string
  args: Record<string, unknown>
  result: unknown
}

export type TickResult = {
  actions: TickAction[]
  messages: { role: string; content: string }[]
  next_wakeup: string | null
  stopped: boolean
}

/**
 * Agent run · 多轮 session-持久化 sync API (架构 §2.7)
 *
 * cast-agents `POST /api/agent/run` 内部 RdsSession.load(session_id) → 拼 history → LLM →
 * append turn → save · 前端只关心 final_text 渲染。
 */
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

export type RunResult = {
  messages: RunMessage[]
  final_text: string
  stop_reason: 'end_turn' | 'max_turns' | 'harness_stop'
  turns_used: number
  usage: RunUsage
  actions: TickAction[]
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return (await r.json()) as T
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
  user: (id: string) => req<User>(`/api/users/${id}`),

  // 虚拟角色市集 · 服务端表名仍是 agents · 字段映射
  marketRoles: (q?: string, limit = 30) => {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    u.set('limit', String(limit))
    return req<RoleSummary[]>(`/api/agents?${u}`)
  },
  roleDetail: (id: string) => req<RoleDetail>(`/api/agents/${id}`),
  myRoles: (ownerId: string) => req<RoleSummary[]>(`/api/agents/mine?owner_id=${ownerId}`),

  // 服务包扁平列表 · 给市集页 (要先取所有角色再展开 services)
  marketServices: async (q?: string): Promise<{ service: ServicePublic; role: RoleSummary }[]> => {
    const roles = await api.marketRoles(q, 30)
    const flat: { service: ServicePublic; role: RoleSummary }[] = []
    for (const r of roles) {
      const detail = await api.roleDetail(r.id).catch(() => null)
      if (!detail) continue
      for (const s of detail.services) flat.push({ service: s, role: r })
    }
    return flat
  },

  // 订单
  createOrder: (buyerId: string, agentId: string, serviceId: number, requirements = '') =>
    req<OrderPublic>(`/api/orders?buyer_id=${buyerId}`, {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId, service_id: serviceId, requirements }),
    }),
  payOrder: (orderId: string) => req<OrderPublic>(`/api/orders/${orderId}/pay`, { method: 'POST' }),
  myOrders: (userId: string) => req<OrderPublic[]>(`/api/orders/mine?user_id=${userId}`),

  // agent runtime tick · 通用 agent 入口 · 老单轮路径 (架构 §2.6 · 兼容保留)
  agentTick: (agentId: string, trigger: Trigger) =>
    agentReq<TickResult>('/api/agent/tick', {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId, trigger }),
    }),

  // agent run · sync 多轮 session-持久化 (架构 §2.7)
  // session_id 前端自生 (eg. `s_${nanoid(12)}`) · 同 session_id 反复 POST · cast-agents 内部续上
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
