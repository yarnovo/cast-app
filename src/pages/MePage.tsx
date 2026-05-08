import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Avatar, Button } from '@akong/core'
import AppShell from '@/components/AppShell'
import { api, type RoleSummary, type User } from '@/api/client'
import { getOwner } from '@/auth'

export default function MePage() {
  const navigate = useNavigate()
  const owner = getOwner()
  const [me, setMe] = useState<User | null>(null)
  const [roles, setRoles] = useState<RoleSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([
      api.user(owner).catch(() => null),
      api.myRoles(owner).catch(() => [] as RoleSummary[]),
    ]).then(([u, list]) => {
      if (!alive) return
      setMe(u)
      setRoles(list)
      setLoading(false)
    })
    return () => { alive = false }
  }, [owner])

  if (loading) {
    return <AppShell><div className="text-center text-[var(--ak-fg-tertiary)] py-24 text-sm">加载中</div></AppShell>
  }

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-6">
        <div className="flex gap-4 items-start">
          <Avatar src={me?.avatar} name={me?.name || owner} size="xl" />
          <div className="flex-1 pt-1 min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight leading-tight truncate">{me?.name || owner}</h1>
            <p className="text-[13px] text-[var(--ak-fg-secondary)] mt-1.5 line-clamp-2">{me?.bio || '还没有简介'}</p>
          </div>
        </div>

        <div className="flex items-center gap-7 mt-6">
          <Stat label="我的艺人" value={roles.length} />
        </div>
      </header>

      <section className="px-5 pb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight">我的艺人</h2>
        <Button variant="secondary" size="sm" onPress={() => navigate('/create')}>造一个</Button>
      </section>

      <div className="px-3 pb-6">
        {roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <p className="text-[14px] text-[var(--ak-fg-secondary)] leading-relaxed mb-5">还没有艺人 · 跟阿空小造聊几句造一个</p>
            <Button variant="primary" size="lg" onPress={() => navigate('/create')}>去造艺人</Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {roles.map((r) => (
              <Link
                key={r.id}
                to={`/role/${r.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--ak-bg-subtle)]"
              >
                <Avatar src={r.persona.avatar} name={r.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[14px] truncate">{r.name}</div>
                  <div className="text-[12px] text-[var(--ak-fg-tertiary)] mt-0.5 line-clamp-1">{r.tagline || '还没有简介'}</div>
                  <div className="text-[11px] text-[var(--ak-fg-tertiary)] mt-1">{r.services_count} 件服务 · {r.status === 'active' ? '在售' : r.status}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[18px] font-semibold tracking-tight leading-tight">{value}</span>
      <span className="text-[12px] text-[var(--ak-fg-secondary)] mt-0.5">{label}</span>
    </div>
  )
}
