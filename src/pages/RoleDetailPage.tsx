import { useNavigate, useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Avatar, ServiceCard, Button, ChevronLeft } from '@akong/core'
import { api, type RoleDetail } from '@/api/client'
import { getMe } from '@/auth'

export default function RoleDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const me = getMe()
  const [role, setRole] = useState<RoleDetail | null>(null)

  useEffect(() => { api.roleDetail(id).then(setRole).catch(() => {}) }, [id])

  if (!role) return <div className="min-h-screen flex items-center justify-center text-[var(--ak-fg-tertiary)]">加载中</div>

  const isMine = role.owner_id === me

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ak-bg)]">
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top">
        <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center"><ChevronLeft size={24} /></button>
        <span className="flex-1 font-medium text-[15px] truncate">{role.name}</span>
      </header>

      <section className="px-5 pt-3 pb-5 flex gap-4">
        <Avatar src={role.persona.avatar} name={role.name} size="xl" />
        <div className="flex-1 pt-1 min-w-0">
          <h1 className="text-[20px] font-semibold tracking-tight leading-tight">{role.name}</h1>
          <p className="text-[13px] text-[var(--ak-fg-secondary)] mt-1.5 line-clamp-2">{role.tagline}</p>
          <div className="text-[12px] text-[var(--ak-fg-tertiary)] mt-2">
            {role.services_count} 件服务
          </div>
        </div>
      </section>

      <div className="px-5 pb-5 flex gap-2">
        <Link to={`/u/${role.persona.id}`} className="flex-1">
          <Button variant="secondary" size="md" fullWidth>看个人主页</Button>
        </Link>
        {!isMine && (
          <Link to={`/dm/${role.persona.id}`} className="flex-1">
            <Button variant="primary" size="md" fullWidth>私信</Button>
          </Link>
        )}
      </div>

      <section className="flex-1 px-2">
        <div className="columns-2 gap-2.5">
          {role.services.map((s) => (
            <ServiceCard
              key={s.id}
              id={String(s.id)}
              title={s.title}
              cover={role.persona.avatar}
              priceCents={s.price_cents}
              seller={{ id: role.persona.id, name: role.name, avatar: role.persona.avatar }}
              slaHours={s.sla_hours}
              onPress={() => navigate(`/service/${s.id}?role=${role.id}`)}
            />
          ))}
        </div>
      </section>

      {role.expertise && (
        <section className="px-5 py-5 border-t border-[var(--ak-border-subtle)]">
          <h2 className="text-[14px] font-semibold mb-2 tracking-tight">关于</h2>
          <p className="text-[14px] text-[var(--ak-fg-secondary)] leading-relaxed whitespace-pre-line">{role.expertise}</p>
        </section>
      )}
    </div>
  )
}
