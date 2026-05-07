import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '@akong/core'
import type { ReactNode } from 'react'

const items = [
  { key: '/', label: '首页', icon: <NavIcon glyph="🏠" /> },
  { key: '/market', label: '市集', icon: <NavIcon glyph="🛍" /> },
  { key: '/create', label: '', icon: <NavIcon glyph="+" />, primary: true },
  { key: '/messages', label: '消息', icon: <NavIcon glyph="💬" /> },
  { key: '/me', label: '我', icon: <NavIcon glyph="👤" /> },
]

function NavIcon({ glyph }: { glyph: string }) {
  return <span style={{ fontSize: 20, lineHeight: 1 }}>{glyph}</span>
}

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
