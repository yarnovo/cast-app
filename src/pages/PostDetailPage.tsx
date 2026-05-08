import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Avatar, Button, ChevronLeft, Heart, LazyImage, Trash } from '@akong/core'
import { toast } from 'sonner'
import { api, type PostPublic } from '@/api/client'
import { getMe } from '@/auth'
import { relativeTime } from '@/utils/time'

export default function PostDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const me = getMe()
  const [post, setPost] = useState<PostPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .getPost(id, me)
      .then((p) => alive && setPost(p))
      .catch(() => alive && setPost(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id, me])

  const isMine = post?.author.id === me

  const toggleLike = async () => {
    if (!post) return
    const prev = post
    setPost({
      ...post,
      is_liked: !post.is_liked,
      likes: post.is_liked ? Math.max(0, post.likes - 1) : post.likes + 1,
    })
    try {
      const r = await api.likePost(post.id, me)
      setPost((cur) => (cur ? { ...cur, is_liked: r.liked, likes: r.likes } : cur))
    } catch {
      setPost(prev)
    }
  }

  const toggleFollow = async () => {
    if (!post || isMine || followBusy) return
    setFollowBusy(true)
    try {
      const r = await api.follow(me, post.author.id)
      setPost({ ...post, is_following_author: r.following })
      toast.success(r.following ? '已关注' : '已取消关注')
    } catch (e) {
      toast.error('操作失败', { description: String(e) })
    } finally {
      setFollowBusy(false)
    }
  }

  const onDelete = async () => {
    if (!post || !isMine) return
    if (!confirm('确认删除这条帖子?')) return
    try {
      await api.deletePost(post.id, me)
      toast.success('已删除')
      navigate('/')
    } catch (e) {
      toast.error('删除失败', { description: String(e) })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--ak-fg-tertiary)]">加载中</div>
    )
  }
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--ak-fg-tertiary)]">帖子不存在</div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ak-bg)] pb-20">
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur flex items-center px-2 py-2 safe-top">
        <button onClick={() => navigate(-1)} aria-label="返回" className="w-11 h-11 flex items-center justify-center">
          <ChevronLeft size={24} />
        </button>
        <span className="flex-1 font-medium text-[15px]">帖子详情</span>
        {isMine && (
          <button
            onClick={onDelete}
            aria-label="删除"
            className="w-11 h-11 flex items-center justify-center text-[var(--ak-fg-secondary)]"
          >
            <Trash size={20} />
          </button>
        )}
      </header>

      <section className="px-4 py-3 flex items-center gap-3">
        <Link to={`/u/${post.author.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar src={post.author.avatar} name={post.author.name} size="lg" />
          <div className="min-w-0">
            <div className="text-[15px] font-medium truncate">{post.author.name}</div>
            <div className="text-[12px] text-[var(--ak-fg-tertiary)] mt-0.5">
              {relativeTime(post.created_at)}
              {post.location ? ` · ${post.location}` : ''}
            </div>
          </div>
        </Link>
        {!isMine && (
          <Button
            variant={post.is_following_author ? 'secondary' : 'primary'}
            size="sm"
            disabled={followBusy}
            onPress={toggleFollow}
          >
            {post.is_following_author ? '已关注' : '关注'}
          </Button>
        )}
      </section>

      {post.content && (
        <section className="px-4 pt-1 pb-4">
          <p className="text-[15px] leading-relaxed whitespace-pre-line">{post.content}</p>
        </section>
      )}

      {post.images.length > 0 && (
        <section className="space-y-2 pb-4">
          {post.images.map((src, i) => (
            <div key={i} className="bg-[var(--ak-bg-subtle)]">
              <LazyImage src={src} alt={`图${i + 1}`} aspectRatio={1} objectFit="cover" />
            </div>
          ))}
        </section>
      )}

      <section className="px-4 py-3 border-t border-[var(--ak-border-subtle)] flex items-center gap-5 text-[var(--ak-fg-secondary)]">
        <button
          aria-label={post.is_liked ? '取消点赞' : '点赞'}
          onClick={toggleLike}
          className="flex items-center gap-1.5 text-[14px]"
        >
          <Heart
            size={22}
            color={post.is_liked ? '#ff385c' : 'currentColor'}
            style={post.is_liked ? { fill: '#ff385c' } : undefined}
          />
          <span>{post.likes || 0}</span>
        </button>
      </section>

      <section className="px-4 py-6 border-t border-[var(--ak-border-subtle)]">
        <h2 className="text-[14px] font-semibold mb-2">评论</h2>
        <p className="text-[13px] text-[var(--ak-fg-tertiary)]">评论功能即将上线</p>
      </section>
    </div>
  )
}
