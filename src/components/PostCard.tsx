import { Avatar, Heart, LazyImage } from '@akong/core'
import { Link } from 'react-router-dom'
import type { PostPublic } from '@/api/client'
import { relativeTime } from '@/utils/time'

export interface PostCardProps {
  post: PostPublic
  /** 点赞回调 · 父组件控状态 (api.likePost 后乐观更新) */
  onToggleLike?: (post: PostPublic) => void
  /** 整卡点击 · 默认跳 /post/:id */
  onPress?: () => void
}

/** Cast · 简陋帖子卡片 (类小红书 inline 版本) · 头像 + 内容 line-clamp-3 + 第一张图 + 点赞 + 时间 */
export function PostCard({ post, onToggleLike, onPress }: PostCardProps) {
  const cover = post.images[0]
  return (
    <Link
      to={onPress ? '#' : `/post/${post.id}`}
      onClick={(e) => {
        if (onPress) {
          e.preventDefault()
          onPress()
        }
      }}
      className="block bg-[var(--ak-bg)] border-b border-[var(--ak-border-subtle)] px-4 py-3 active:bg-[var(--ak-bg-subtle)]"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <Link
          to={`/u/${post.author.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2.5 min-w-0"
        >
          <Avatar src={post.author.avatar} name={post.author.name} size="md" />
          <div className="min-w-0">
            <div className="text-[14px] font-medium truncate">{post.author.name}</div>
            <div className="text-[11px] text-[var(--ak-fg-tertiary)] mt-0.5">
              {relativeTime(post.created_at)}
              {post.location ? ` · ${post.location}` : ''}
            </div>
          </div>
        </Link>
      </div>
      {post.content && (
        <p className="text-[14px] leading-relaxed text-[var(--ak-fg)] line-clamp-3 whitespace-pre-line">
          {post.content}
        </p>
      )}
      {cover && (
        <div className="mt-2 rounded-lg overflow-hidden bg-[var(--ak-bg-subtle)]">
          <LazyImage src={cover} alt="" aspectRatio={4 / 3} objectFit="cover" />
        </div>
      )}
      <div className="flex items-center gap-4 mt-2.5 text-[var(--ak-fg-secondary)]">
        <button
          aria-label={post.is_liked ? '取消点赞' : '点赞'}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleLike?.(post)
          }}
          className="flex items-center gap-1 min-h-[32px] text-[12px]"
        >
          <Heart
            size={18}
            color={post.is_liked ? '#ff385c' : 'currentColor'}
            style={post.is_liked ? { fill: '#ff385c' } : undefined}
          />
          <span>{post.likes || ''}</span>
        </button>
      </div>
    </Link>
  )
}

export default PostCard
