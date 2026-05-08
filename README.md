# Cast (角儿)

C2A2C 数字角色平台 · akong 旗下第一个产品。

真人造数字角色 · 角色在平台开店接活 · 买家随时下单 · AI 自动交付简单活 / 复杂活转真人。

## 跑

```bash
npm install
npm run dev
# http://localhost:5174 (缩到 480 看 H5)
```

## 技术栈

- Vite 8 + React 19 + TS 6
- Tailwind 4 (token CSS variables)
- @akong/core (一行 import 9 组件 + tokens · 跨端 Web/RN 就绪)
- 后端: cast-api (https://api.cast.agentaily.com · 待部署 · 公司主域 agentaily.com 子域)

## 路由

(REQ-004 · 5-9 老板拍 v3) `/` 默认入口 = 跟阿空小造的对话页 · 砍中间 ➕ 创建按钮 · 其他页全留。

| path | page | 说明 |
|---|---|---|
| `/` | ChatPage | **默认** · 跟阿空小造 (ag_builtin_meta-xiaozao) 多轮对话造 agent |
| `/home` | HomePage | 内容 feed (老首页 · 不在 BottomNav · 直链可达) |
| `/market` | MarketPage | 市集 (服务商品瀑布流) |
| `/messages` | MessagesPage | 消息 (BottomNav tab) |
| `/me` | MePage | 我 (当前用户主页) |
| `/service/:id?role=` | ServiceDetailPage | 商品详情 + 下单 |
| `/role/:id` | RoleDetailPage | 角色店铺主页 |

BottomNav 4 tab: 对话(/) · 市集(/market) · 消息(/messages) · 我(/me) — 中间 ➕ 创建按钮已砍。

## 域名

公司官方主域 = **agentaily.com** (aliyun 注册 · 2027-03-20 到期)。所有子域挂在此。

- 开发: localhost:5174
- staging: https://staging.m.cast.agentaily.com (push develop 自动 deploy)
- prod: https://m.cast.agentaily.com (push main 自动 deploy)
- 后端 (cast-api): https://api.cast.agentaily.com
- agent runtime (cast-agents): https://api.cast-agents.agentaily.com

## ChatPage 多轮对话

`/` 默认就是 ChatPage · 跟阿空小造 (`ag_builtin_meta-xiaozao`) 多轮对话造 agent · 跟 Claude Code 风一样**连续多轮**:

- session_id 进页时自动生成 (格式 `s_` + 12 位 [a-z0-9]) · sessionStorage(`cast_session`) + url query (`?s=...`) 双持久化 · 刷新页面不丢
- 用户输入 → POST `/api/agent/run` (sync · 同 session_id) · cast-agents 内部 RdsSession 自动续上下文 · 前端不用拼 history
- 只渲染 LLM 的 `final_text` 单条气泡 (不展示中间 system / tool_use turns)
- 头部"重开"按钮: 清 session + 生新 session_id + 清 UI history · 老 session 留在 cast-api DB 做审计
- 上游契约见 [CONTRACTS.md](./CONTRACTS.md)

## 测

```bash
npm run test:e2e          # 单 chromium · 跑 e2e/*.spec.ts (含多轮 spec) · ≤ 60s/case
npm run test:e2e:ui       # ui mode 调试用
```
