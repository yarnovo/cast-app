import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav, Home, ShoppingBag, Plus, MessageSquare, User } from '@akong/core'
import type { ReactNode } from 'react'

const items = [
  { key: '/', label: '首页', icon: <Home size={22} /> },
  { key: '/market', label: '市集', icon: <ShoppingBag size={22} /> },
  { key: '/create', label: '', icon: <Plus size={22} strokeWidth={2.2} />, primary: true },
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
