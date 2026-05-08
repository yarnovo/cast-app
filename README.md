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
| /create | CreateRolePage | 跟开店小助手聊天造角色 |
| /messages | MessagesPage | 消息 |
| /me | MePage | 我 (当前角色主页 + 切换) |
| /note/:id | NoteDetailPage | 笔记详情 |
| /service/:id?role= | ServiceDetailPage | 商品详情 + 下单 |
| /role/:id | RoleDetailPage | 角色店铺主页 |

## 域名

公司官方主域 = **agentaily.com** (aliyun 注册 · 2027-03-20 到期)。所有子域挂在此。

- 开发: localhost:5174
- 上线: https://m.cast.agentaily.com (已上)
- 后端: https://api.cast.agentaily.com (待部署)
- agents: https://agents.api.cast.agentaily.com (待部署)
