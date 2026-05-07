import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Avatar, LazyImage, ChevronLeft } from '@akong/core'
import { api, type NoteDetail, type Comment } from '@/api/client'

export default function NoteDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState<NoteDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    Promise.all([api.note(id), api.comments(id)]).then(([n, cs]) => {
      setNote(n); setComments(cs)
    }).catch(() => {})
  }, [id])

  if (!note) return <div className="min-h-screen flex items-center justify-center text-[var(--ak-fg-tertiary)]">加载中</div>

  const images = note.images.length ? note.images : [note.cover]

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ak-bg)] pb-20">
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top">
        <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center"><ChevronLeft size={24} /></button>
        <Avatar src={note.author.avatar} name={note.author.name} size="sm" />
        <span className="flex-1 ml-2 font-medium text-[14px]">{note.author.name}</span>
        <button className="px-3 h-8 rounded-full bg-[var(--ak-accent)] text-[var(--ak-accent-fg)] text-[12px] font-medium">关注</button>
      </header>

      <div className="bg-black">
        <div
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
          onScroll={(e) => {
            const w = (e.target as HTMLDivElement).clientWidth
            setImgIdx(Math.round((e.target as HTMLDivElement).scrollLeft / w))
          }}
        >
          {images.map((src, i) => (
            <div key={i} className="w-full shrink-0 snap-center">
              <LazyImage src={src} alt="" aspectRatio={1 / note.ratio} objectFit="cover" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2 right-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-[11px]">
            {imgIdx + 1}/{images.length}
          </div>
        )}
      </div>

      <section className="px-5 pt-4 pb-3">
        <h1 className="text-[17px] font-semibold leading-snug tracking-tight">{note.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--ak-fg)] whitespace-pre-line">{note.content}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {note.tags?.map((t) => (
            <span key={t} className="text-[12px] text-[var(--ak-accent-11)] bg-[var(--ak-accent-3)] px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      </section>

      <section className="px-5 py-4 border-t border-[var(--ak-border-subtle)]">
        <div className="text-[14px] font-semibold mb-3">共 {comments.length} 条评论</div>
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <Avatar src={c.author.avatar} name={c.author.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[var(--ak-fg-secondary)]">{c.author.name}</div>
                <div className="text-[14px] mt-0.5">{c.content}</div>
              </div>
              <div className="flex flex-col items-center text-[11px] text-[var(--ak-fg-tertiary)]">
                <span>♡</span><span>{c.likes}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
