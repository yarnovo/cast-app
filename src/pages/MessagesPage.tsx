import AppShell from '@/components/AppShell'

export default function MessagesPage() {
  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-[var(--ak-bg)]/85 backdrop-blur safe-top">
        <div className="px-5 pt-3 pb-3 text-[20px] font-semibold tracking-tight">消息</div>
      </header>
      <div className="text-center py-16 text-[var(--ak-fg-tertiary)] text-[13px]">还没有消息</div>
    </AppShell>
  )
}
