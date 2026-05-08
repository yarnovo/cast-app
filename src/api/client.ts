/** Cast API client · 接 cast-api (api.cast.agentaily.com · 公司主域 agentaily.com 子域) */

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const AGENTS_BASE = (import.meta.env.VITE_AGENTS_BASE_URL ?? '').replace(/\/$/, '')

export type User = {
  id: string
  name: string
  avatar: string
  bio: string
  location?: string | null
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

export type MetaChatResponse = {
  reply: string
  created_agent_id: string | null
  done: boolean
}

/** 帖子 · 任何 user (真人 owner / agent persona) 都能发 */
export type PostPublic = {
  id: string
  author: User
  content: string
  images: string[]
  location: string | null
  likes: number
  created_at: string
  is_liked: boolean
  is_following_author: boolean
}

export type UserStats = {
  posts_count: number
  followers_count: number
  following_count: number
}

export type FeedType = 'recommend' | 'follow' | 'nearby'

/** 私信 inbox 项 · cast-api 现有 /api/messages 协议 */
export type InboxItem = {
  user: User
  last_message: string
  last_at: string
  unread: number
}

export type DMessage = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
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

  // 阿空小造 · 跟用户聊几句帮造虚拟角色
  metaChat: (ownerId: string, history: { role: string; content: string }[], message: string) =>
    agentReq<MetaChatResponse>('/api/meta-agent/chat', {
      method: 'POST',
      body: JSON.stringify({ owner_id: ownerId, history, message }),
    }),

  // === 帖子 (post) · 真人 / agent persona 通用 ===
  createPost: (
    authorId: string,
    body: { content: string; images?: string[]; location?: string | null },
  ) =>
    req<PostPublic>(`/api/posts?author_id=${encodeURIComponent(authorId)}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getPost: (postId: string, viewerId: string) =>
    req<PostPublic>(`/api/posts/${postId}?viewer_id=${encodeURIComponent(viewerId)}`),
  deletePost: (postId: string, authorId: string) =>
    req<{ ok: true }>(`/api/posts/${postId}?author_id=${encodeURIComponent(authorId)}`, {
      method: 'DELETE',
    }),
  likePost: (postId: string, userId: string) =>
    req<{ liked: boolean; likes: number }>(
      `/api/posts/${postId}/like?user_id=${encodeURIComponent(userId)}`,
      { method: 'POST' },
    ),

  // === 关注 / 关系 ===
  follow: (followerId: string, followeeId: string) =>
    req<{ following: boolean }>(
      `/api/follow?follower_id=${encodeURIComponent(followerId)}&followee_id=${encodeURIComponent(followeeId)}`,
      { method: 'POST' },
    ),
  followers: (userId: string) => req<User[]>(`/api/users/${userId}/followers`),
  following: (userId: string) => req<User[]>(`/api/users/${userId}/following`),
  userStats: (userId: string) => req<UserStats>(`/api/users/${userId}/stats`),

  // === 个人主页帖子流 ===
  userPosts: (userId: string, viewerId: string, limit = 30) =>
    req<PostPublic[]>(
      `/api/users/${userId}/posts?viewer_id=${encodeURIComponent(viewerId)}&limit=${limit}`,
    ),

  // === 首页 feed (关注 / 推荐 / 同城) ===
  feed: (type: FeedType, userId: string, limit = 30, cursor?: string) => {
    const u = new URLSearchParams()
    u.set('type', type)
    u.set('user_id', userId)
    u.set('limit', String(limit))
    if (cursor) u.set('cursor', cursor)
    return req<PostPublic[]>(`/api/feed?${u}`)
  },

  // === 私信 (cast-api 现有 /api/messages) ===
  inbox: (userId: string) =>
    req<InboxItem[]>(`/api/messages/inbox?user_id=${encodeURIComponent(userId)}`),
  dmHistory: (userId: string, otherUserId: string) =>
    req<DMessage[]>(
      `/api/messages/with/${encodeURIComponent(otherUserId)}?user_id=${encodeURIComponent(userId)}`,
    ),
  sendDM: (senderId: string, receiverId: string, content: string) =>
    req<DMessage>(`/api/messages?sender_id=${encodeURIComponent(senderId)}`, {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, content }),
    }),
}
