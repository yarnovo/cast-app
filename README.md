# Cast (角儿)

C2A2C 数字角色平台 · akong 旗下第一个产品。

真人造数字角色 · 角色在平台开店接活 · 买家随时下单 · AI 自动交付简单活 / 复杂活转真人。

## 形态 (REQ-003 · 5-9 老板拍 · ChatGPT / Claude Code CLI 风)

整个 cast-app 就**一页对话**。打开 `m.cast.agentaily.com` → 直接看到跟阿空小造的聊天界面 ·
所有"管理"动作 (查 agent / 改 agent / 看 post / 下单 ...) 都通过跟 meta 对话触发对应 tool · meta agent 调 cast-api 拿 / 改数据。

UI 层只剩 1 个 `ChatPage`:
- top: meta 头像 + "阿空小造" + 重开 + 用户头像
- main: 对话气泡
- bottom: 输入框

没有 BottomNav / TabBar / list / feed / profile / detail / notification / settings 页 — 全砍。

## 跑

```bash
npm install
npm run dev
# http://localhost:5174 (缩到 480 看 H5)
```

## 技术栈

- Vite 8 + React 19 + TS 6
- Tailwind 4 (token CSS variables)
- @akong/core (Avatar / ChatLayout / ChatBubble / ChatInput / TypingIndicator)
- 后端: cast-agents (https://api.cast-agents.agentaily.com · 直接调 `/api/agent/run` · 多轮 session 持久化)
  · 业务数据 (cast-api) 不再由前端直调 · 一律通过 meta 对话触发 tool

## 路由

| path | page | 说明 |
|---|---|---|
| `/` | ChatPage | 单页对话 (默认 agent_id=`ag_builtin_meta-xiaozao` 阿空小造) |
| `*` | ChatPage | 任何路径都 fallback 回 ChatPage (单页 app) |

## 域名

公司官方主域 = **agentaily.com** (aliyun 注册 · 2027-03-20 到期)。所有子域挂在此。

- 开发: localhost:5174
- staging: https://staging.m.cast.agentaily.com (push develop 自动 deploy)
- prod: https://m.cast.agentaily.com (push main 自动 deploy)
- 后端 (cast-api): https://api.cast.agentaily.com
- agent runtime (cast-agents): https://api.cast-agents.agentaily.com

## 多轮对话

`ChatPage` 跟阿空小造聊天 · 真造 agent · 跟 Claude Code 风一样**连续多轮**:

- session_id 进页自动生成 (格式 `s_` + 12 位 [a-z0-9]) · sessionStorage(`cast_session`) + url query (`?s=...`) 双持久化 · 刷新页面不丢
- 用户输入 → POST `/api/agent/run` (sync · 同 session_id) · cast-agents 内部 RdsSession 自动续上下文
- 只渲染 LLM 的 `final_text` 单条气泡 (不展示中间 system / tool_use turns)
- 头部"重开"按钮: 清 session + 生新 session_id + 清 UI history · 老 session 留 cast-api DB 做审计
- 上游契约见 [CONTRACTS.md](./CONTRACTS.md)

## 测

```bash
npm run test:e2e          # 单 chromium · 跑 e2e/*.spec.ts · ≤ 60s/case
npm run test:e2e:ui       # ui mode 调试用
```
