# RhythmCafe

[rhythm.cafe](https://rhythm.cafe)（节奏医生社区关卡站）的国内访问镜像。提供官方站点搜索、下载、数据库接口的代理，以及本站前端。

- 后端将请求转发到官方 Rhythm Cafe 与官方 Datasette，并把 JSON 原样返回给前端，**不缓存关卡数据**。
- 前端提供关卡搜索、筛选、分页浏览与下载。

## 项目结构

| 路径 | 说明 |
| --- | --- |
| `Web/` | 前端：Vue 3 + TypeScript + Vite |
| `Server/` | 后端代理：Fastify 5 + TypeScript (ESM) |
| `API.md` | 完整 API 文档（搜索 / 数据库搜索 / 全量拉取 / 下载 / 错误码） |
| `LICENSE` | MIT 开源协议 |

## 功能特性

- 关卡搜索：关键词、标签（`tags_all`）、作者（`authors_all`）、艺术家（`artists_all`）、难度、BPM 区间、审核状态（同行评审 / 待审 / 未通过 / 全部）筛选
- 分页浏览：每页条数可调，支持 20 / 50 / 100 / 200 / 500（数据库搜索接口 `/api/levels/db`）
- 关卡下载：`.rdzip` 文件直传，支持断点续传（HTTP Range → 206）
- 全量数据拉取：Datasette 兼容代理 `/api/db`，路径与参数和官方完全一致
- 无需登录、无需 API Key、无需官方 Cookie；CORS 已开启

## 接口一览

| 接口 | 说明 |
| --- | --- |
| `GET /api/levels` | 搜索关卡（每页固定 22 条，透传官方搜索服务） |
| `GET /api/levels/db` | 数据库搜索（每页最多 500 条，直接中转官方 Datasette） |
| `GET /api/db/rdlevels/rdlevels.json` | Datasette 兼容代理（全量拉取，游标分页） |
| `GET /api/levels/{id}/download` | 下载关卡 `.rdzip`（支持 Range） |

详细参数与返回结构见 [API.md](API.md)。

## 快速开始

前置要求：Node.js 18+、pnpm。

### 1. 启动后端（端口 7332）

```bash
cd Server
pnpm install
pnpm dev        # 开发模式（tsx watch，自动重载）
# 或
pnpm build && pnpm start
```

### 2. 启动前端（端口 5173）

```bash
cd Web
pnpm install
pnpm dev
```

开发环境下 Vite 会把 `/api` 代理到 `http://127.0.0.1:7332`，浏览器访问 `http://localhost:5173` 即可。

## 配置

### Server 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `7332` | 后端监听端口 |
| `HOST` | `0.0.0.0` | 后端监听地址 |
| `CORS_ORIGIN` | 所有来源 | 允许的跨域来源，多个用逗号分隔 |
| `RHYTHM_CAFE_BASE_URL` | `https://rhythm.cafe` | 官方站点地址 |
| `DATASETTE_BASE_URL` | `https://datasette.rhythm.cafe` | 官方数据库地址 |
| `UPSTREAM_USER_AGENT` | `RhythmCafeProxy/0.1` | 请求上游时使用的 User-Agent |

### Web 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | 后端 API 地址前缀 |

生产环境通常由 Nginx 把 `/api` 反向代理到后端的 `7332` 端口，并把静态文件指向 `Web/dist/`。

## 开源协议

[MIT](LICENSE) © 2026 memsys-lizi

> 本项目仅提供网络代理与镜像访问功能，所有关卡数据、图片与文件均来源于官方 Rhythm Cafe，版权归原权利人所有。请尊重原创作品与社区规则。