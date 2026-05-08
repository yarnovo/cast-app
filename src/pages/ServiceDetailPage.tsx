import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Avatar, Button, LazyImage, ChevronLeft, MessageSquare } from '@akong/core'
import { toast } from 'sonner'
import { api, type RoleDetail, type ServicePublic } from '@/api/client'
import { getOwner } from '@/auth'

export default function ServiceDetailPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const roleId = params.get('role') || ''
  const navigate = useNavigate()
  const me = getOwner()
  const [role, setRole] = useState<RoleDetail | null>(null)
  const [service, setService] = useState<ServicePublic | null>(null)
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    if (!roleId) return
    api.roleDetail(roleId).then((r) => {
      setRole(r)
      setService(r.services.find((s) => s.id === Number(id)) || r.services[0] || null)
    }).catch(() => {})
  }, [roleId, id])

  const order = async () => {
    if (!service || !role || ordering) return
    setOrdering(true)
    try {
      const o = await api.createOrder(me, role.id, service.id, '')
      await api.payOrder(o.id)
      toast.success(`下单成功 ¥${(o.price_cents / 100).toFixed(0)}`)
      setTimeout(() => navigate('/me'), 600)
    } catch (e) {
      toast.error('下单失败', { description: String(e) })
    } finally { setOrdering(false) }
  }

  if (!role || !service) return <div className="min-h-screen flex items-center justify-center text-[var(--ak-fg-tertiary)]">加载中</div>

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ak-bg)] pb-20">
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top">
        <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center"><ChevronLeft size={24} /></button>
        <span className="flex-1 font-medium text-[15px]">商品详情</span>
      </header>

      <div className="aspect-square bg-[var(--ak-bg-subtle)]">
        <LazyImage src={role.persona.avatar} alt={service.title} aspectRatio={1} objectFit="cover" />
      </div>

      <section className="px-5 pt-5 pb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-[20px] font-semibold tracking-tight">¥</span>
          <span className="text-[34px] font-semibold leading-none tracking-tight">
            {new Intl.NumberFormat('zh-CN').format(service.price_cents / 100)}
          </span>
        </div>
        <h1 className="mt-3 text-[18px] font-semibold tracking-tight leading-snug">{service.title}</h1>
        <p className="mt-3 text-[14px] text-[var(--ak-fg-secondary)] leading-relaxed whitespace-pre-line">{service.description}</p>
        <div className="mt-4 text-[12px] text-[var(--ak-fg-tertiary)]">
          {service.sla_hours} 小时内交付 · {service.mode === 'ai' ? 'AI 自动' : service.mode === 'human' ? '真人手作' : 'AI + 真人协作'}
        </div>
      </section>

      <Link to={`/role/${role.id}`} className="px-5 py-4 border-t border-[var(--ak-border-subtle)] flex items-center gap-3">
        <Avatar src={role.persona.avatar} name={role.name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium truncate">{role.name}</div>
          <div className="text-[12px] text-[var(--ak-fg-tertiary)] mt-0.5">{role.services_count} 件服务</div>
        </div>
        <Button variant="secondary" size="sm">进店</Button>
      </Link>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[var(--ak-bg)] border-t border-[var(--ak-border-subtle)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => toast.info('客服功能即将上线')} aria-label="客服" className="flex flex-col items-center text-[10px] w-12 min-h-[44px] justify-center text-[var(--ak-fg-secondary)]">
            <MessageSquare size={20} />
            <span className="mt-0.5">客服</span>
          </button>
          {role.owner_id === me ? (
            <div className="flex-1 text-center text-[14px] text-[var(--ak-fg-tertiary)] py-2">这是你的商品</div>
          ) : (
            <Button variant="primary" size="lg" disabled={ordering} onPress={order} fullWidth>
              {ordering ? '处理中' : `立即下单 · ¥${(service.price_cents / 100).toFixed(0)}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
