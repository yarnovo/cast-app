import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Avatar, Button, AgentSwitcher } from '@akong/core'
import AppShell from '@/components/AppShell'
import { api, type RoleDetail, type RoleSummary, type OrderPublic } from '@/api/client'
import { getOwner, getActiveRole, getActivePersona, setActiveRole } from '@/auth'

const TABS = ['服务', '订单'] as const
type Tab = typeof TABS[number]

export default function MePage() {
  const navigate = useNavigate()
  const owner = getOwner()
  const activeId = getActiveRole()
  const personaId = getActivePersona()
  const [role, setRole] = useState<RoleDetail | null>(null)
  const [allRoles, setAllRoles] = useState<RoleSummary[]>([])
  const [orders, setOrders] = useState<OrderPublic[]>([])
  const [tab, setTab] = useState<Tab>('服务')
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [needPick, setNeedPick] = useState(false)

  useEffect(() => {
    if (!activeId) {
      api.myRoles(owner).then((list) => {
        if (list.length === 0) setNeedPick(true)
        else { setActiveRole(list[0].id, list[0].persona.id); location.reload() }
      }).catch(() => setNeedPick(true))
      return
    }
    api.roleDetail(activeId).then(setRole).catch(() => setRole(null))
    api.myRoles(owner).then(setAllRoles).catch(() => {})
    api.myOrders(personaId || owner).then(setOrders).catch(() => {})
  }, [activeId, owner, personaId])

  if (needPick) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <h1 className="text-[22px] font-semibold tracking-tight mb-2">你还没有虚拟角色</h1>
          <p className="text-[14px] text-[var(--ak-fg-secondary)] leading-relaxed mb-6">跟角色助手聊几句 · 几分钟造一个</p>
          <Button variant="primary" size="lg" onPress={() => navigate('/create')}>创建第一个角色</Button>
        </div>
      </AppShell>
    )
  }

  if (!role) return <AppShell><div className="text-center text-[var(--ak-fg-tertiary)] py-24 text-sm">加载中</div></AppShell>

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-6">
        <div className="flex gap-4 items-start">
          <button onClick={() => setSwitcherOpen(true)} className="shrink-0">
            <Avatar src={role.persona.avatar} name={role.name} size="xl" />
          </button>
          <div className="flex-1 pt-1 min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight leading-tight truncate">{role.name}</h1>
            <p className="text-[13px] text-[var(--ak-fg-secondary)] mt-1.5 line-clamp-2">{role.tagline || '还没有简介'}</p>
          </div>
        </div>

        <div className="flex items-center gap-7 mt-6">
          <Stat label="服务" value={role.services.length} />
          <Stat label="订单" value={orders.length} />
          <Stat label="状态" valueText={role.status === 'active' ? '在售' : role.status} />
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="secondary" size="sm" fullWidth onPress={() => setSwitcherOpen(true)}>切换角色</Button>
          <Link to={`/role/${role.id}`} className="flex-1">
            <Button variant="secondary" size="sm" fullWidth>进店逛逛</Button>
          </Link>
        </div>
      </header>

      <div className="bg-[var(--ak-bg)] sticky top-0 z-20 border-b border-[var(--ak-border-subtle)]">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-[14px] relative ${tab === t ? 'text-[var(--ak-fg)] font-semibold' : 'text-[var(--ak-fg-tertiary)]'}`}
            >
              {t}
              {tab === t && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[var(--ak-fg)] rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-3 pb-6">
        {tab === '服务' && (role.services.length === 0 ? <Empty hint="还没上架服务包" /> : (
          <div className="space-y-2.5">
            {role.services.map((s) => (
              <Link
                key={s.id}
                to={`/service/${s.id}?role=${role.id}`}
                className="block p-3 rounded-xl bg-[var(--ak-bg-subtle)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-medium text-[14px] truncate">{s.title}</div>
                  <div className="text-[14px] font-semibold tracking-tight shrink-0">¥{(s.price_cents / 100).toFixed(0)}</div>
                </div>
                <div className="text-[12px] text-[var(--ak-fg-tertiary)] mt-1 line-clamp-2">{s.description}</div>
                <div className="text-[11px] text-[var(--ak-fg-tertiary)] mt-1.5">
                  {s.sla_hours}h 交付 · {s.mode === 'ai' ? 'AI' : s.mode === 'human' ? '真人' : 'AI + 真人'}
                </div>
              </Link>
            ))}
          </div>
        ))}
        {tab === '订单' && (orders.length === 0 ? <Empty hint="还没有订单" /> : (
          <div className="space-y-2.5">
            {orders.map((o) => (
              <div key={o.id} className="p-3 rounded-xl bg-[var(--ak-bg-subtle)]">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-[14px] truncate">订单 {o.id.slice(0, 8)}</div>
                  <div className="text-[14px] font-semibold">¥{(o.price_cents / 100).toFixed(0)}</div>
                </div>
                <div className="text-[11px] text-[var(--ak-fg-tertiary)] mt-1">
                  {o.status} · {new Date(o.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <AgentSwitcher
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        agents={allRoles.map((r) => ({ id: r.id, name: r.name, tagline: r.tagline, avatar: r.persona.avatar }))}
        activeId={activeId || undefined}
        onSelect={(id) => {
          const r = allRoles.find((x) => x.id === id)
          if (r) { setActiveRole(r.id, r.persona.id); location.reload() }
        }}
        onCreateNew={() => navigate('/create')}
        title="切换角色"
      />
    </AppShell>
  )
}

function Stat({ label, value, valueText }: { label: string; value?: number; valueText?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[18px] font-semibold tracking-tight leading-tight">{valueText ?? value ?? 0}</span>
      <span className="text-[12px] text-[var(--ak-fg-secondary)] mt-0.5">{label}</span>
    </div>
  )
}

function Empty({ hint }: { hint: string }) {
  return <div className="text-center text-[13px] text-[var(--ak-fg-tertiary)] py-16">{hint}</div>
}
