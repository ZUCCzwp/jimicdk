# Jimi CDK

ChatGPT 卡密兑换前端。React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + [HeroUI](https://www.heroui.com/)，对接 [jimicdkgo](../jimicdkgo) 的 `/api/v1`。

## 页面

| 路径 | 作用 |
|---|---|
| `/` | 三段式兑换：核验卡密、粘贴 Session、确认提交 |
| `/orders` | 跟踪进度（本地记录卡密，5.5 秒轮询） |
| `/cancel` | 查询并取消还在排队的任务（成功后任务记录删除，卡密可重提） |
| `/subscription` | 查询 ChatGPT 订阅 |
| `/faq` | 常见问题 |
| `/admin` | 管理后台：兑换码池（购入 / 分配 / 列表） |
| `/admin/tasks` | 管理后台：查询充值任务 |

## 开发

先启动后端：

```bash
cd ../jimicdkgo
go run ./cmd/api -f cmd/api/etc/recharge-api.yaml
```

再启动前端（Vite 把 `/api` 代理到 `127.0.0.1:8888`）：

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173 。演示卡密：`ab12cd34-ef56-7890-abcd-ef1234567890`。

管理后台：http://localhost:5173/admin （本地默认 `admin` / `admin123`）。

生产构建：`npm run build`。直连后端时设置 `VITE_API_BASE`，并在后端配置 `CORS_ALLOWED_ORIGINS`。
