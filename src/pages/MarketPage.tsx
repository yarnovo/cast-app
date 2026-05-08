import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ServiceCard, Skeleton } from '@akong/core'
import AppShell from '@/components/AppShell'
import { api, type ServicePublic, type RoleSummary } from '@/api/client'

type Item = { service: ServicePublic; role: RoleSummary }
const CATEGORIES = ['推荐', '设计', '咨询', '开发', '文创', '生活']

export default function MarketPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [composing, setComposing] = useState(false)
  const [cat, setCat] = useState('推荐')
  const [committedQ, setCommittedQ] = useState('')
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (composing) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => setCommittedQ(q), 250)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [q, composing])

  useEffect(() => {
    let alive = true
    setLoading(true)
    api.marketServices(committedQ || undefined)
      .then((d) => alive && setItems(d))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [committedQ])

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur safe-top">
        <div className="px-3 pt-3 pb-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={(e) => { setComposing(false); setQ((e.target as HTMLInputElement).value) }}
            placeholder="搜索服务"
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="none"
            className="w-full h-9 px-3 bg-[var(--ak-bg-subtle)] rounded-full text-[14px] outline-none text-[var(--ak-fg)] placeholder:text-[var(--ak-fg-tertiary)]"
          />
        </div>
        <nav className="flex gap-5 px-4 pb-2 overflow-x-auto no-scrollbar text-[14px]">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`pb-2 shrink-0 relative ${
                cat === c ? 'font-semibold text-[var(--ak-fg)]' : 'text-[var(--ak-fg-tertiary)]'
              }`}
            >
              {c}
              {cat === c && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--ak-fg)] rounded-full" />}
            </button>
          ))}
        </nav>
      </header>

      <div className="px-2 pt-2">
        {loading ? (
          <div className="columns-2 gap-2.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="break-inside-avoid mb-2.5">
                <Skeleton height={180} radius="lg" />
                <div className="px-1 pt-2 space-y-1.5">
                  <Skeleton height={14} radius="sm" />
                  <Skeleton height={14} width="66%" radius="sm" />
                  <Skeleton height={20} width="33%" radius="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-sm text-[var(--ak-fg-tertiary)] py-12">还没有服务</div>
        ) : (
          <div className="columns-2 gap-2.5">
            {items.map((it) => (
              <ServiceCard
                key={`${it.role.id}-${it.service.id}`}
                id={String(it.service.id)}
                title={it.service.title}
                cover={it.role.persona.avatar || ''}
                priceCents={it.service.price_cents}
                seller={{ id: it.role.persona.id, name: it.role.persona.name || it.role.name, avatar: it.role.persona.avatar }}
                slaHours={it.service.sla_hours}
                onPress={() => navigate(`/service/${it.service.id}?role=${it.role.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
