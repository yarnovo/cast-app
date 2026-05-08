import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav, Home, ShoppingBag, MessageSquare, User } from '@akong/core'
import type { ReactNode } from 'react'

/**
 * BottomNav (REQ-004 · 5-9 老板拍 v3)
 *
 * 砍掉中间 `/create` ➕ 号 · 造 agent 通过跟阿空小造对话 (默认 `/` 路由 ChatPage)。
 * 4 个 tab: 对话(/) · 市集(/market) · 消息(/messages) · 我(/me)。
 *
 * HomePage feed 路由保留在 `/home` (不进 BottomNav · 老 link / 内部跳转可达 · 保留代码避免砍页面)。
 */
const items = [
  { key: '/', label: '对话', icon: <Home size={22} />, primary: true },
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
