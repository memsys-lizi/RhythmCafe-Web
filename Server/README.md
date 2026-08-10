# RhythmCafe Server

RhythmCafe 后端代理：Fastify 5 + TypeScript (ESM)。

## 功能

- `GET /api/levels`：搜索关卡，透传官方搜索服务（每页固定 22 条）
- `GET /api/levels/db`：数据库搜索，直接中转官方 Datasette（每页最多 500 条，不做全量缓存）
- `GET /api/db/rdlevels/rdlevels.json`：Datasette 兼容代理，支持游标分页拉取全量数据
- `GET /api/levels/{id}/download`：关卡下载，支持断点续传（Range → 206）

接口详情见仓库根目录的 [API.md](../API.md)。

## 开发

```bash
pnpm install
pnpm dev        # tsx watch，热重载
```

## 构建与启动

```bash
pnpm build
pnpm start
```

默认监听 `0.0.0.0:7332`。

## 配置（环境变量）

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `7332` | 监听端口 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `CORS_ORIGIN` | 所有来源 | 允许的跨域来源，多个用逗号分隔 |
| `RHYTHM_CAFE_BASE_URL` | `https://rhythm.cafe` | 官方站点地址 |
| `DATASETTE_BASE_URL` | `https://datasette.rhythm.cafe` | 官方数据库地址 |
| `UPSTREAM_USER_AGENT` | `RhythmCafeProxy/0.1` | 请求上游时使用的 User-Agent |

## 目录结构

```text
src/
  upstream.ts          # 上游 URL 构建与请求（白名单参数，不透传任意 SQL）
  levelSearchDb.ts     # 数据库搜索：参数翻译 / 游标映射 / 格式转换
  routes/
    levels.ts          # /api/levels
    levelsDb.ts        # /api/levels/db
    downloads.ts       # /api/levels/{id}/download
    datasette.ts       # /api/db 透传代理
  server.ts            # 入口：CORS 与路由注册
```

## 测试

```bash
node smoke-levels-db.mjs   # /api/levels/db 冒烟测试（需要先启动服务）
```