/** Cast API client · 接 cast-api (api.cast.agentaily.com · 公司主域 agentaily.com 子域) */

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const AGENTS_BASE = (import.meta.env.VITE_AGENTS_BASE_URL ?? '').replace(/\/$/, '')

export type User = {
  id: string
  name: string
  avatar: string
  bio: string
  followers: number
  following: number
}

export type NoteSummary = {
  id: string
  title: string
  cover: string
  ratio: number
  likes: number
  author: User
}

export type NoteDetail = NoteSummary & {
  content: string
  images: string[]
  tags: string[]
  collects: number
  comments_count: number
  created_at: string
}

export type Comment = {
  id: string
  content: string
  likes: number
  created_at: string
  author: User
}

export type FeedResponse = { items: NoteSummary[]; next_cursor: string | null }
export type ToggleResponse = { active: boolean; count: number }

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

export type MetaChatResponse = {
  reply: string
  created_agent_id: string | null
  done: boolean
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
  // notes (内容 feed)
  feed: (cursor?: string | null, limit = 20) => {
    const q = new URLSearchParams()
    if (cursor) q.set('cursor', cursor)
    q.set('limit', String(limit))
    return req<FeedResponse>(`/api/notes?${q}`)
  },
  note: (id: string) => req<NoteDetail>(`/api/notes/${id}`),
  comments: (id: string) => req<Comment[]>(`/api/notes/${id}/comments`),
  postComment: (id: string, content: string) =>
    req<Comment>(`/api/notes/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  toggleLike: (id: string) => req<ToggleResponse>(`/api/notes/${id}/like`, { method: 'POST' }),
  toggleCollect: (id: string) => req<ToggleResponse>(`/api/notes/${id}/collect`, { method: 'POST' }),
  user: (id: string) => req<User>(`/api/users/${id}`),
  userNotes: (id: string) => req<NoteSummary[]>(`/api/users/${id}/notes`),

  // roles (数字角色市场 · 服务端表名仍是 agents · 字段映射就行)
  marketRoles: (q?: string, limit = 30) => {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    u.set('limit', String(limit))
    return req<RoleSummary[]>(`/api/agents?${u}`)
  },
  roleDetail: (id: string) => req<RoleDetail>(`/api/agents/${id}`),
  myRoles: (ownerId: string) => req<RoleSummary[]>(`/api/agents/mine?owner_id=${ownerId}`),

  // services flat list 给市集页
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

  // orders
  createOrder: (buyerId: string, agentId: string, serviceId: number, requirements = '') =>
    req<OrderPublic>(`/api/orders?buyer_id=${buyerId}`, {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId, service_id: serviceId, requirements }),
    }),
  payOrder: (orderId: string) => req<OrderPublic>(`/api/orders/${orderId}/pay`, { method: 'POST' }),
  myOrders: (userId: string) => req<OrderPublic[]>(`/api/orders/mine?user_id=${userId}`),

  // meta-agent (创角色对话)
  metaChat: (ownerId: string, history: { role: string; content: string }[], message: string) =>
    agentReq<MetaChatResponse>('/api/meta-agent/chat', {
      method: 'POST',
      body: JSON.stringify({ owner_id: ownerId, history, message }),
    }),
}
