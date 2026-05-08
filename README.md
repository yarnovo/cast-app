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

| path | page | 说明 |
|---|---|---|
| / | HomePage | 内容 feed (笔记瀑布流) |
| /market | MarketPage | 市集 (服务商品瀑布流) |
| /messages | MessagesPage | 消息 (顶部钉"阿空小造" 系统会话) |
| /messages/:agentId | ConversationDetailPage | 单聊天页 (跟某 agent 多轮对话) |
| /me | MePage | 我 (当前角色主页 + 切换) |
| /note/:id | NoteDetailPage | 笔记详情 |
| /service/:id?role= | ServiceDetailPage | 商品详情 + 下单 |
| /role/:id | RoleDetailPage | 角色店铺主页 |

## 域名

公司官方主域 = **agentaily.com** (aliyun 注册 · 2027-03-20 到期)。所有子域挂在此。

- 开发: localhost:5174
- staging: https://staging.m.cast.agentaily.com (push develop 自动 deploy)
- prod: https://m.cast.agentaily.com (push main 自动 deploy)
- 后端 (cast-api): https://api.cast.agentaily.com
- agent runtime (cast-agents): https://api.cast-agents.agentaily.com

## 阿空小造 在聊天列表置顶 (REQ-002 · 5-9 老板拍 UX 简化)

UX 同 ChatGPT 主页: 砍"创建 agent" ➕ 入口 / 砍 /create 路由 · /messages 顶部钉一条不可删除的系统会话"阿空小造" (`ag_builtin_meta-xiaozao`) · 用户点进去 = 普通的单聊天页 (`ConversationDetailPage`) · 跟它聊就能造 agent。

`ConversationDetailPage` (路由 `/messages/:agentId`) 跟 Claude Code 风一样**连续多轮**:

- session_id 进页时自动生成 (格式 `s_` + 12 位 [a-z0-9]) · 写入 sessionStorage (key `cast_session:${agentId}:${userId}`) · 刷新 / 跨页持久化
- 用户输入 → POST `/api/agent/run` (sync · 同 session_id) · cast-agents 内部 RdsSession 自动续上下文 · 前端不用拼 history
- 只渲染 LLM 的 `final_text` 单条气泡 (不展示中间 system / tool_use turns)
- 阿空小造 显示"重开"按钮 (清 session + 生新 session_id + 清 UI history · 老 session 留 cast-api DB 做审计) · 其他 agent 不显示
- 上游契约见 [CONTRACTS.md](./CONTRACTS.md)

## 测

```bash
npm run test:e2e          # 单 chromium · 跑 e2e/*.spec.ts (含多轮 spec) · ≤ 60s/case
npm run test:e2e:ui       # ui mode 调试用
```
