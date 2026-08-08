# Rhythm Cafe API 文档

这是 Rhythm Cafe 国内访问代理的 API 文档。后端服务接收前端请求后，会转发到 Rhythm Cafe，并将上游返回的 JSON 原样返回。

## 1. 基本信息

### 线上地址

```text
https://cafe.rhythmdoctor.top/api
```

### 本地地址

开发环境通常通过 Vite 代理访问：

```text
http://127.0.0.1:5173/api
```

后端直接访问地址：

```text
http://127.0.0.1:7332/api
```

生产环境中，浏览器访问 `/api`，由 Nginx 转发到后端的 `7332` 端口。

### 通用说明

- 所有接口均使用 `GET` 请求。
- 返回 JSON 的接口使用 `application/json; charset=utf-8`。
- 当前接口不要求登录、不要求 API Key，也不要求传递 Rhythm Cafe 的 Cookie。
- 关卡图片仍然使用 Rhythm Cafe CDN 返回的图片地址。
- 后端不会接受任意 URL，因此不能通过本接口代理其他网站。
- API 已开启 CORS，其他网站也可以直接请求。
- 后端会保留上游 JSON 结构，不会把 `props.results` 改成其他格式。
- 查询参数需要进行 URL 编码，例如中文关键词 `狗` 应编码为 `%E7%8B%97`。

## 2. 搜索关卡

```http
GET /api/levels
```

线上示例：

```text
https://cafe.rhythmdoctor.top/api/levels?q=%E7%8B%97&page=1
```

### 2.1 请求参数

所有参数都是可选的。不传参数时，会使用 Rhythm Cafe 上游的默认搜索条件。

| 参数 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `q` | string | 否 | 搜索关键词。可以搜索歌曲名、艺术家、作者、标签等内容。 |
| `page` | integer | 否 | 页码，从 `1` 开始。当前页大小由返回值中的 `results.limit` 决定，不要在客户端写死。 |
| `tags_all` | string，可重复 | 否 | 标签筛选。多个标签需要重复传入，表示按照多个标签进行筛选。 |
| `authors_all` | string，可重复 | 否 | 作者筛选。多个作者需要重复传入。 |
| `artists_all` | string，可重复 | 否 | 艺术家筛选。对应返回结果中的 `artist_tokens`，不是完整的 `artist` 字符串。 |
| `difficulty` | string，可重复 | 否 | 难度筛选，可传 `0`、`1`、`2`、`3`。对应 Easy、Medium、Tough、Very Tough。 |
| `min_bpm` | number | 否 | 最低 BPM。 |
| `max_bpm` | number | 否 | 最高 BPM。 |
| `peer_review` | string | 否 | 审核状态，可传 `peer`、`pending`、`rejected`、`all`。 |

### 2.2 难度值

| 值 | 英文名称 | 中文含义 |
| --- | --- | --- |
| `0` | `Easy` | 简单 |
| `1` | `Medium` | 中等 |
| `2` | `Tough` | 困难 |
| `3` | `Very Tough` | 非常困难 |

### 2.3 审核状态值

| 值 | 页面显示名称 | 中文含义 |
| --- | --- | --- |
| `peer` | Peer Reviewed | 已进行同行评审 |
| `pending` | Pending | 等待审核 |
| `rejected` | Non-Refereed | 未通过同行评审或非同行评审 |
| `all` | All | 全部审核状态 |

当前前端页面上的“Non-Refereed”选项会自动转换为 API 参数 `peer_review=rejected`。

当前前端默认使用 Peer Reviewed，也就是不额外传递 `peer_review`；如果需要明确指定，也可以传 `peer_review=peer`。

### 2.4 多选参数的传递方式

多选参数不能使用逗号拼接，应该使用同名参数重复传入：

```text
/api/levels?tags_all=vocaloid&tags_all=1p&authors_all=%E7%8B%97%E5%B0%8F%E7%99%BD
```

JavaScript 示例：

```ts
const params = new URLSearchParams()
params.set('q', '狗')
params.set('page', '1')
params.append('tags_all', 'vocaloid')
params.append('tags_all', '1p')
params.append('authors_all', '狗小白')
params.append('difficulty', '1')

const response = await fetch(`/api/levels?${params.toString()}`)
const data = await response.json()
```

### 2.5 完整请求示例

```http
GET /api/levels?q=%E7%8B%97&page=1&tags_all=vocaloid&tags_all=1p&authors_all=%E7%8B%97%E5%B0%8F%E7%99%BD&artists_all=%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF&difficulty=1&min_bpm=100&max_bpm=200&peer_review=peer
```

等价的 JavaScript 请求：

```ts
const params = new URLSearchParams({
  q: '狗',
  page: '1',
  artists_all: '初音ミク',
  difficulty: '1',
  min_bpm: '100',
  max_bpm: '200',
  peer_review: 'peer'
})

params.append('tags_all', 'vocaloid')
params.append('tags_all', '1p')
params.append('authors_all', '狗小白')

const response = await fetch(
  `https://cafe.rhythmdoctor.top/api/levels?${params}`
)
const data = await response.json()
```

## 3. 搜索接口返回结构

### 3.1 顶层结构

```json
{
  "action": "render",
  "view": "cafe:level_search",
  "overlay": false,
  "metadata": {
    "title": ""
  },
  "props": {
    "results": {}
  },
  "context": {},
  "messages": []
}
```

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `action` | string | 上游页面动作类型，当前通常为 `render`。 |
| `view` | string | 上游页面视图名称，当前通常为 `cafe:level_search`。 |
| `overlay` | boolean | 是否为覆盖层响应。普通搜索通常为 `false`。 |
| `metadata` | object | 页面元数据。 |
| `metadata.title` | string | 页面标题。 |
| `props` | object | 页面实际数据容器。 |
| `props.results` | object | 搜索结果和筛选项。 |
| `context` | object | 上游上下文信息，可能存在，也可能为空或后续增加字段。 |
| `messages` | array | 上游消息列表，通常为空数组。 |

`context` 和 `messages` 属于上游透传字段，客户端不应该依赖它们一定存在。

### 3.2 `props.results` 字段

```json
{
  "hits": [],
  "estimatedTotalHits": 204,
  "processingTimeMs": 12,
  "limit": 22,
  "offset": 0,
  "query": "狗",
  "facetDistribution": {}
}
```

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `hits` | array | 当前页的关卡数组。每个元素都是一个关卡对象。 |
| `estimatedTotalHits` | number | 符合条件的结果总数。字段名中的 `estimated` 表示这是上游估算值。 |
| `processingTimeMs` | number | 上游处理本次查询耗时，单位为毫秒。 |
| `limit` | number | 当前每页最大返回数量。 |
| `offset` | number | 当前结果的偏移量，从 `0` 开始。 |
| `query` | string | 上游实际使用的搜索关键词。 |
| `facetDistribution` | object | 筛选项分布数据，例如标签、作者、艺术家和难度。 |

页码可以按照下面的公式计算：

```text
当前页 = offset / limit + 1
```

不要根据 `hits.length` 判断是否还有下一页，应优先使用：

```text
offset + hits.length < estimatedTotalHits
```

### 3.3 `facetDistribution` 筛选项

线上目前常见的分组包括：

```json
{
  "artist_tokens": [],
  "tags": [],
  "authors": [],
  "difficulty": [],
  "single_player": [],
  "two_player": [],
  "submitter.id": [],
  "club.id": []
}
```

每个分组都是 `FacetCount` 数组：

```json
{
  "count": 46,
  "highlighted": "来因洛特",
  "value": "来因洛特"
}
```

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `count` | number | 使用该筛选值的结果数量。 |
| `highlighted` | string | 上游根据搜索词生成的高亮显示文本。 |
| `value` | string | 真正应该用于下一次筛选请求的值。 |

常见分组说明：

| 分组 | 中文说明 | 对应请求参数 |
| --- | --- | --- |
| `artist_tokens` | 艺术家拆分后的名称列表 | `artists_all` |
| `tags` | 标签列表 | `tags_all` |
| `authors` | 谱面作者列表 | `authors_all` |
| `difficulty` | 难度值 `0` 到 `3` | `difficulty` |
| `single_player` | 是否支持单人 | 当前页面未使用 |
| `two_player` | 是否支持双人 | 当前页面未使用 |
| `submitter.id` | 提交者 ID | 当前页面未使用 |
| `club.id` | 所属社团 ID | 当前页面未使用 |

筛选时应该使用 `value`，不要使用 `count` 或 `highlighted`。

## 4. 关卡对象字段

`props.results.hits` 中的每个元素都是一个关卡对象。下面是当前线上返回的字段说明。

### 4.1 基本信息

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `id` | string | 关卡唯一 ID。下载接口使用这个值。 |
| `song` | string | 歌曲或关卡名称。 |
| `song_alt` | string | 歌曲名称的备用名称，可能为空字符串。 |
| `song_raw` | string | 未处理的原始歌曲名称。 |
| `artist` | string | 完整艺术家字符串，可能包含多个艺术家。 |
| `artist_tokens` | string[] | 拆分后的艺术家名称数组，用于艺术家筛选。 |
| `artist_raw` | string | 未处理的原始艺术家字符串。 |
| `authors` | string[] | 谱面作者数组。 |
| `authors_raw` | string | 未处理的原始作者字符串。 |
| `description` | string | 关卡描述。 |
| `tags` | string[] | 关卡标签数组。 |
| `last_updated` | string | 最后更新时间，ISO 8601 格式，例如 `2024-02-13T06:24:42+08:00`。 |
| `hue` | number | 上游用于生成页面配色的色相值，通常为 `0` 到 `1`。 |

### 4.2 难度和 BPM

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `difficulty` | number | 难度值：`0` 简单、`1` 中等、`2` 困难、`3` 非常困难。 |
| `min_bpm` | number | 最低 BPM。 |
| `max_bpm` | number | 最高 BPM。单一 BPM 的关卡通常与 `min_bpm` 相同。 |
| `single_player` | boolean | 是否支持单人游玩。 |
| `two_player` | boolean | 是否支持双人游玩。 |

### 4.3 图片和下载地址

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `image_url` | string | 关卡完整尺寸封面图片地址。 |
| `thumb_url` | string | 关卡缩略图地址，适合列表卡片使用。 |
| `icon_url` | string | 关卡图标地址。 |
| `rdzip_url` | string | 上游 `.rdzip` 文件地址。前端下载按钮使用本项目的下载代理，不建议直接使用此地址。 |

### 4.4 校验和与版本信息

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `sha1` | string | 关卡资源的 SHA-1 校验值。 |
| `rdlevel_sha1` | string | `.rdlevel` 文件的 SHA-1 校验值。 |
| `rd_md5` | string | 关卡资源的 MD5 校验值。 |
| `prefill_version` | number | 关卡预填充数据版本号。 |

这些字段适合用于缓存校验、判断文件是否变化或去重，不建议当作页面展示内容。

### 4.5 审核、提交和可见性

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `approval` | number | 上游审核数值。本项目不对这个数值做二次转换。 |
| `approval_notes_public` | string | 公开审核备注，可能为空字符串。 |
| `submitter` | object | 提交者信息。 |
| `submitter.id` | string | 提交者唯一 ID。 |
| `submitter.displayName` | string | 提交者显示名称。 |
| `club` | object \| null | 关卡所属社团信息，可能为空。 |
| `club.id` | string | 社团唯一 ID。仅在 `club` 不为空时存在。 |
| `club.name` | string | 社团显示名称。仅在 `club` 不为空时存在。 |
| `is_private` | boolean | 是否为私有关卡。 |
| `is_hidden` | boolean | 是否被隐藏。 |
| `seizure_warning` | boolean | 是否需要显示闪烁或癫痫警告。 |

### 4.6 谱面特性标记

以下字段都是布尔值，表示谱面中是否包含对应类型的内容：

| 字段 | 中文说明 |
| --- | --- |
| `is_animated` | 是否包含动画内容。 |
| `has_classics` | 是否包含 Classic 类型内容。 |
| `has_oneshots` | 是否包含 One-shot。 |
| `has_squareshots` | 是否包含 Square-shot。 |
| `has_freezeshots` | 是否包含 Freeze-shot。 |
| `has_burnshots` | 是否包含 Burn-shot。 |
| `has_holdshots` | 是否包含 Hold-shot。 |
| `has_triangleshots` | 是否包含 Triangle-shot。 |
| `has_skipshots` | 是否包含 Skip-shot。 |
| `has_subdivs` | 是否包含细分节拍内容。 |
| `has_synco` | 是否包含 Synco 类型内容。 |
| `has_freetimes` | 是否包含 Free Time。 |
| `has_holds` | 是否包含 Hold。 |
| `has_window_dance` | 是否包含 Window Dance。 |
| `has_rdcode` | 是否包含 RDCode。 |
| `has_cpu_rows` | 是否包含 CPU 行。 |

### 4.7 其他统计字段

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `total_hits_approx` | number | 上游统计的近似命中数量，具体统计口径由 Rhythm Cafe 定义。 |

### 4.8 关卡对象示例

下面是一个真实结构的简化示例。为便于阅读，省略了部分 `has_*` 字段：

```json
{
  "id": "rcXsW2Mc",
  "artist": "ピノキオピー feat. 初音ミク & ARuFa",
  "artist_tokens": ["ピノキオピー", "初音ミク & ARuFa"],
  "artist_raw": "ピノキオピー feat. 初音ミク & ARuFa",
  "song": "匿名M",
  "song_alt": "",
  "song_raw": "匿名M",
  "seizure_warning": true,
  "description": "There is an anonymous singer...",
  "hue": 0.5,
  "authors": ["NoMathExpectation"],
  "authors_raw": "NoMathExpectation",
  "min_bpm": 140,
  "max_bpm": 140,
  "difficulty": 1,
  "single_player": true,
  "two_player": false,
  "last_updated": "2024-02-13T06:24:42+08:00",
  "tags": ["2024节奏医生拜年祭", "ピノキオピー", "初音ミク", "ARuFa"],
  "sha1": "2d03bd100a9787036191be49c17d59af3d58144d",
  "rdlevel_sha1": "ba6f86d2a9464648f5a2f99cdff26f38b264aaf1",
  "rd_md5": "5a6e41dc6043f4e3ab8d028a3d7ee505",
  "is_animated": false,
  "rdzip_url": "https://c2.rhythm.cafe/rdzips/example.rdzip",
  "image_url": "https://c2.rhythm.cafe/images/example.png",
  "thumb_url": "https://c2.rhythm.cafe/thumbs/example.webp",
  "icon_url": "https://c2.rhythm.cafe/icons/example.png",
  "submitter": {
    "id": "uwf86TH2",
    "displayName": "23333"
  },
  "club": {
    "id": "c1QGJ3sR",
    "name": "RDL"
  },
  "approval": 10,
  "approval_notes_public": "",
  "is_private": false,
  "prefill_version": 2,
  "total_hits_approx": 119,
  "is_hidden": false
}
```

实际返回的完整字段以服务器当前返回为准。上游以后增加字段时，本代理会继续原样返回新字段。

## 5. 下载关卡

```http
GET /api/levels/{id}/download
```

示例：

```text
https://cafe.rhythmdoctor.top/api/levels/rcXsW2Mc/download
```

### 5.1 路径参数

| 参数 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 关卡唯一 ID，只允许 `A-Z`、`a-z`、`0-9`，长度为 1 到 64 个字符。 |

后端会根据 ID 固定请求上游：

```text
https://rhythm.cafe/levels/{id}/download/
```

前端不能传入完整 URL，也不能传入任意文件路径。

### 5.2 成功响应

下载接口不会返回 JSON，而是直接返回 `.rdzip` 文件二进制流。

完整下载通常返回：

```http
HTTP/1.1 200 OK
Content-Type: application/octet-stream
Content-Length: 25413426
Content-Disposition: attachment; filename*=UTF-8''...
Accept-Ranges: bytes
Cache-Control: no-store
```

### 5.3 断点续传

客户端可以传入 `Range` 请求头：

```http
GET /api/levels/rcXsW2Mc/download
Range: bytes=0-99
```

成功时返回：

```http
HTTP/1.1 206 Partial Content
Content-Length: 100
Content-Range: bytes 0-99/25413426
Accept-Ranges: bytes
```

后端会透传以下上游响应头：

| 响应头 | 中文说明 |
| --- | --- |
| `Content-Type` | 文件类型，通常为 `application/octet-stream`。 |
| `Content-Length` | 本次响应的文件大小。断点续传时是当前分片大小。 |
| `Content-Disposition` | 下载文件名和附件下载指示。 |
| `Accept-Ranges` | 是否支持按字节范围下载。 |
| `Content-Range` | 当前分片的字节范围和完整文件大小。206 响应时通常存在。 |
| `ETag` | 上游文件版本标识，可能存在。 |
| `Last-Modified` | 上游文件最后修改时间，可能存在。 |
| `Cache-Control` | 当前代理固定返回 `no-store`。 |

浏览器直接下载示例：

```html
<a href="/api/levels/rcXsW2Mc/download">
  下载谱面
</a>
```

JavaScript 下载示例：

```ts
const levelId = 'rcXsW2Mc'
window.location.href = `/api/levels/${encodeURIComponent(levelId)}/download`
```

使用 `fetch` 手动请求分片的示例：

```ts
const response = await fetch('/api/levels/rcXsW2Mc/download', {
  headers: {
    Range: 'bytes=0-99'
  }
})

console.log(response.status) // 206
console.log(response.headers.get('content-range'))
const chunk = await response.arrayBuffer()
```

## 6. 错误响应

### 6.1 关卡 ID 格式错误

```http
GET /api/levels/invalid-id!/download
```

返回：

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
```

```json
{
  "error": "INVALID_LEVEL_ID",
  "message": "无效的关卡 ID"
}
```

### 6.2 上游服务不可用

当后端无法连接 Rhythm Cafe、请求超时或上游请求失败时，接口返回：

```http
HTTP/1.1 502 Bad Gateway
Content-Type: application/json; charset=utf-8
```

```json
{
  "error": "UPSTREAM_UNAVAILABLE",
  "message": "关卡服务暂时不可用，请稍后再试"
}
```

下载接口如果上游返回具体的 `404`、`403` 或其他 HTTP 状态，后端会保留并转发上游状态。

### 6.3 常见 HTTP 状态码

| 状态码 | 含义 |
| --- | --- |
| `200` | 请求成功，搜索返回 JSON 或下载返回完整文件。 |
| `206` | 下载请求成功，返回部分文件内容。 |
| `400` | 请求参数或关卡 ID 格式错误。 |
| `404` | 请求路径不存在，或上游找不到该关卡。 |
| `502` | 后端无法正常访问上游 Rhythm Cafe。 |

## 7. curl 调用示例

### 搜索

```bash
curl "https://cafe.rhythmdoctor.top/api/levels?q=%E7%8B%97&page=1"
```

### 带筛选条件搜索

```bash
curl "https://cafe.rhythmdoctor.top/api/levels?q=%E7%8B%97&page=1&tags_all=vocaloid&tags_all=1p&difficulty=1&min_bpm=100&max_bpm=200&peer_review=peer"
```

### 查看下载响应头

```bash
curl -I "https://cafe.rhythmdoctor.top/api/levels/rcXsW2Mc/download"
```

### 测试断点续传

```bash
curl -v -H "Range: bytes=0-99" -o part.rdzip "https://cafe.rhythmdoctor.top/api/levels/rcXsW2Mc/download"
```

## 8. 与前端项目的关系

前端的 `Web/src/services/api.ts` 会读取后端原始响应中的：

```text
data.props.results.hits
data.props.results.estimatedTotalHits
data.props.results.limit
data.props.results.offset
data.props.results.facetDistribution
```

然后在前端内部整理成：

```ts
{
  levels,
  totalResults,
  page,
  pageSize,
  facets
}
```

这个整理后的结构只存在于前端服务层，并不是后端 `/api/levels` 的实际返回格式。
