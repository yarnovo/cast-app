import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import '@akong/core/style.css'  // tokens + 9 组件样式 一行
import './index.css'

import ChatPage from './pages/ChatPage'
import HomePage from './pages/HomePage'
import MarketPage from './pages/MarketPage'
import MessagesPage from './pages/MessagesPage'
import MePage from './pages/MePage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import RoleDetailPage from './pages/RoleDetailPage'
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

function PageTransition({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  return <div key={loc.pathname} className="page-enter">{children}</div>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeWatcher />
      <Toaster position="top-center" theme="system" closeButton={false} />
      <div className="mx-auto max-w-[480px] min-h-screen bg-[var(--ak-bg)] text-[var(--ak-fg)] relative">
        <PageTransition>
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/me" element={<MePage />} />
            <Route path="/service/:id" element={<ServiceDetailPage />} />
            <Route path="/role/:id" element={<RoleDetailPage />} />
          </Routes>
        </PageTransition>
      </div>
    </BrowserRouter>
  </React.StrictMode>,
)
