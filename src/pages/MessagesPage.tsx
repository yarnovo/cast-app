import { useNavigate } from 'react-router-dom'
import { Avatar } from '@akong/core'
import AppShell from '@/components/AppShell'

const META_AGENT_ID = 'ag_builtin_meta-xiaozao'
const META_NAME = '阿空小造'
const META_SUBTITLE = '帮你打造你的 AI 角色'

/**
 * 消息列表页 · 顶部钉一条系统会话"阿空小造" (不可删除 / 不可隐藏)。
 * 用户点进去 = 普通的单聊天页 (ConversationDetailPage) · 跟它聊就能造 agent。
 *
 * MVP 阶段除阿空小造外暂无其他真私信会话 · 后续接入用户↔角色私信走同一列表 · 同一详情页。
 */
export default function MessagesPage() {
  const navigate = useNavigate()
  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur safe-top">
        <div className="px-5 pt-3 pb-3 text-[20px] font-semibold tracking-tight">消息</div>
      </header>

      <div className="px-3">
        <button
          data-testid="pinned-meta-xiaozao"
          onClick={() => navigate(`/messages/${META_AGENT_ID}`)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--ak-bg-subtle)] mb-2 text-left"
        >
          <Avatar name={META_NAME} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                data-testid="pin-indicator"
                aria-label="置顶"
                title="置顶 · 不可删除"
                className="text-[10px] font-medium text-[var(--ak-fg-tertiary)] bg-[var(--ak-bg)] px-1.5 py-0.5 rounded border border-[var(--ak-border-subtle)]"
              >
                置顶
              </span>
              <span className="font-medium text-[14px] truncate">{META_NAME}</span>
            </div>
            <div className="text-[12px] text-[var(--ak-fg-tertiary)] mt-0.5 line-clamp-1">{META_SUBTITLE}</div>
          </div>
        </button>

        <div className="text-center py-12 text-[var(--ak-fg-tertiary)] text-[13px]">还没有其他消息</div>
      </div>
    </AppShell>
  )
}
