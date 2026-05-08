import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import '@akong/core/style.css'  // tokens + 9 组件样式 一行
import './index.css'

import ChatPage from './pages/ChatPage'
import './auth'

function ThemeWatcher() {
  React.useEffect(() => {
    const m = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', m.matches)
    apply()
    m.addEventListener('change', apply)
    return () => m.removeEventListener('change', apply)
  }, [])
  return null
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeWatcher />
      <Toaster position="top-center" theme="system" closeButton={false} />
      <div className="mx-auto max-w-[480px] min-h-screen bg-[var(--ak-bg)] text-[var(--ak-fg)] relative">
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="*" element={<ChatPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  </React.StrictMode>,
)
