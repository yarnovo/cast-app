import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ChevronLeft, Image as ImageIcon } from '@akong/core'
import { toast } from 'sonner'
import { api } from '@/api/client'
import { getMe } from '@/auth'

export default function PostCreatePage() {
  const navigate = useNavigate()
  const me = getMe()
  const [content, setContent] = useState('')
  const [location, setLocation] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // 默认带上当前 user 的城市 (作 location)
  useEffect(() => {
    let alive = true
    api
      .user(me)
      .then((u) => {
        if (alive && u.location) setLocation(u.location)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [me])

  const submit = async () => {
    const text = content.trim()
    if (!text || submitting) return
    setSubmitting(true)
    try {
      await api.createPost(me, {
        content: text,
        images: [],
        location: location.trim() || null,
      })
      toast.success('发布成功')
      navigate('/')
    } catch (e) {
      toast.error('发布失败', { description: String(e) })
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = content.trim().length > 0 && !submitting

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ak-bg)]">
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top border-b border-[var(--ak-border-subtle)]">
        <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center">
          <ChevronLeft size={24} />
        </button>
        <span className="flex-1 font-medium text-[15px]">发帖</span>
        <div className="pr-2">
          <Button variant="primary" size="sm" disabled={!canSubmit} onPress={submit}>
            {submitting ? '发布中' : '发布'}
          </Button>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="说点什么..."
          autoFocus
          rows={6}
          className="w-full bg-transparent outline-none text-[15px] leading-relaxed resize-none placeholder:text-[var(--ak-fg-tertiary)]"
        />

        <div className="flex items-center gap-2 text-[13px] text-[var(--ak-fg-tertiary)]">
          <ImageIcon size={18} />
          <span>图片上传即将上线</span>
        </div>

        <div>
          <label className="text-[12px] text-[var(--ak-fg-tertiary)] block mb-1">同城</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例如: 杭州"
            className="w-full h-10 px-3 bg-[var(--ak-bg-subtle)] rounded-lg text-[14px] outline-none text-[var(--ak-fg)] placeholder:text-[var(--ak-fg-tertiary)]"
          />
        </div>
      </div>
    </div>
  )
}
