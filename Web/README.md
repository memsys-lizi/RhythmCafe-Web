# RhythmCafe Web

RhythmCafe 前端：Vue 3 + TypeScript + Vite。

## 功能

- 关卡搜索：关键词 + 侧边栏筛选（标签 / 作者 / 艺术家 / 难度 / BPM / 审核状态）
- 分页浏览：分页器支持每页 20 / 50 / 100 / 200 / 500 条
- 关卡卡片：封面、难度徽章、标签、作者、BPM、下载按钮

## 开发

```bash
pnpm install
pnpm dev
```

开发环境下 Vite 会把 `/api` 代理到 `http://127.0.0.1:7332`（后端），浏览器访问 `http://localhost:5173`。

## 构建

```bash
pnpm build
```

产物输出到 `dist/`。生产环境由 Nginx 托管静态文件，并把 `/api` 反向代理到后端。

## 配置

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | 后端 API 地址前缀 |

API 请求与响应结构见仓库根目录的 [API.md](../API.md)。

## 目录结构

```text
src/
  components/common/   # 搜索栏、关卡卡片、分页器等通用组件
  composables/         # 筛选器状态管理
  services/api.ts      # API 服务层（请求与结果整理）
  types/               # Level / Filters 等类型定义
  views/               # 页面（HomePage 等）
```