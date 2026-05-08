# cast-app · CONTRACTS

cast-app 仓的对外契约 · 申明上下游依赖 + 接口形态。改这些字段记得连同上下游一起跟改。

## 上游 (cast-app 调的服务)

### cast-api (`https://api.cast.agentaily.com` · 主域 agentaily.com 子域)

业务数据 (用户 / 角色 / 服务包 / 订单)。

| endpoint | method | 用途 |
|---|---|---|
| `/api/users/:id` | GET | 用户公开字段 |
| `/api/agents` | GET | 角色 (虚拟艺人) 市集列表 |
| `/api/agents/:id` | GET | 角色详情 + services |
| `/api/agents/mine` | GET | 当前 owner 的角色 |
| `/api/orders` | POST | 下单 |
| `/api/orders/:id/pay` | POST | 支付 |
| `/api/orders/mine` | GET | 我的订单 |

cast-api 内部还存 `chat_messages` (按 session_id 分桶) · 由 cast-agents 的 RdsSession 负责读写 · cast-app **不直接调** chat_messages CRUD。

### cast-agents (`https://api.cast-agents.agentaily.com`)

LLM agent runtime · 给单聊天页 (`/messages/:agentId`) + 未来其他 agent 私信对话提供 sync 推理入口。

| endpoint | method | 用途 |
|---|---|---|
| `/api/agent/tick` | POST | **老路径** · 单轮 (前端拼 history) · 兼容保留 · 新代码不要再用 |
| `/api/agent/run` | POST | **当前主路径** · sync 多轮 · session 持久化由 cast-agents 内部 RdsSession 自管 |

#### `/api/agent/run` request

```json
{
  "agent_id": "ag_builtin_meta-xiaozao",
  "session_id": "s_abcdef123456",
  "user_message": "你好",
  "max_turns": 10
}
```

- `session_id` 由 cast-app **前端自生** (格式 `s_` + 12 位 [a-z0-9]) · sessionStorage key=`cast_session:${agentId}:${userId}` 持久化 · 同一对 (agent, user) 跨刷新 / 跨页续上
- 同 `session_id` 反复 POST · cast-agents 内部走 `RdsSession.load(session_id)` 自动续 history
- `max_turns` 默认 10 · 防 LLM 无限自循环

#### `/api/agent/run` response (RunResult)

```json
{
  "messages": [...],
  "final_text": "好 · 我记住了",
  "stop_reason": "end_turn",
  "turns_used": 1,
  "usage": {"input_tokens": 1234, "output_tokens": 56},
  "actions": [{"tool_id": "cast.create_agent", "args": {...}, "result": {"agent_id": "ag_xxx"}}]
}
```

cast-app 渲染策略 (跟 Claude Code 风一样):

- 只渲染 `final_text` · 1 条 assistant 气泡
- 不展示中间 system / tool_use turns
- `actions` 用来识别副作用 (eg. `cast.create_agent` → 弹"去看角色"按钮)

### 阿空小造在聊天列表置顶 (REQ-002 · 5-9 老板拍)

cast-app `/messages` (MessagesPage) 顶部钉一条系统会话:

- agent_id = `ag_builtin_meta-xiaozao`
- 显示名 "阿空小造" · 副标题 "帮你打造你的 AI 角色" · 含"置顶"标识 (`pin-indicator`)
- **不可删除** (无删除按钮 / 无长按菜单 / 永远第一)
- 点击 → 路由 `/messages/ag_builtin_meta-xiaozao` → `ConversationDetailPage` 加载多轮对话 UI

`ConversationDetailPage` 跟其他 agent 私信走同一组件 / 同一 `/api/agent/run` 路径 (机制无差别) · 仅 UI 上阿空小造显示"重开"按钮。

砍掉的旧链路 (历史 · 不再支持): `/create` 路由 + `CreateRolePage` + 各页 ➕"造一个" / "去造艺人" 入口。

## 下游 (调 cast-app 的客户端)

无 · cast-app 本身是终端用户 H5。

## 部署

| branch | 触发 | 目标 | bucket | 域名 |
|---|---|---|---|---|
| `develop` | push | staging | `agentaily-cast-app-staging` | https://staging.m.cast.agentaily.com |
| `main` | push | prod | `agentaily-cast-app` | https://m.cast.agentaily.com |

CI 见 `.github/workflows/deploy.yml`。

## 改这份契约

cast-app maintainer 改 `/api/agent/run` 形态前要先跟 cast-agents maintainer 同步 · 同 PR 改两边或先改上游再改下游 · 不能 cast-app 单边改。
