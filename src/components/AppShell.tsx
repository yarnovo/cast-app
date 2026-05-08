import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav, Home, ShoppingBag, MessageSquare, User } from '@akong/core'
import type { ReactNode } from 'react'

/**
 * BottomNav (REQ-005 · 5-9 老板拍 v4)
 *
 * 4 tab · 砍中间 ➕ (老板拍 · 造 agent 通过对话不需要按钮)。
 * "我" tab 路由 /me 现在 render ChatPage (跟阿空小造对话) · 不再是 user profile。
 * 其他 3 tab (首页 / 市集 / 消息) 不动。
 */
const items = [
  { key: '/', label: '首页', icon: <Home size={22} /> },
  { key: '/market', label: '市集', icon: <ShoppingBag size={22} /> },
  { key: '/messages', label: '消息', icon: <MessageSquare size={22} /> },
  { key: '/me', label: '我', icon: <User size={22} /> },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen flex flex-col bg-[var(--ak-bg)]">
      <main className="flex-1 pb-14">{children}</main>
      <BottomNav
        items={items}
        activeKey={pathname}
        onSelect={(k) => navigate(k)}
      />
    </div>
  )
}
