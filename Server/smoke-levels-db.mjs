// 冒烟测试 /api/levels/db（本地 7332）
const BASE = 'http://localhost:7332/api/levels/db'

async function get(path) {
  const res = await fetch(`${BASE}?${path}`)
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  return { status: res.status, body }
}

let failed = 0
function check(name, cond, detail = '') {
  if (cond) {
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name} ${detail}`)
  }
}

console.log('1) per_page=500')
{
  const { status, body } = await get('per_page=500')
  const r = body.props?.results
  check('status 200', status === 200, String(status))
  check('limit=500', r?.limit === 500, `limit=${r?.limit}`)
  check('hits.length=500', r?.hits?.length === 500, `len=${r?.hits?.length}`)
  check('hits[0] 形状', !!r?.hits?.[0]?.id && Array.isArray(r.hits[0].tags) && typeof r.hits[0].single_player === 'boolean')
  if (r?.hits?.[0]) {
    const h = r.hits[0]
    console.log(`    示例: id=${h.id} song=${h.song} tags=${JSON.stringify(h.tags)} submitter=${JSON.stringify(h.submitter)} club=${JSON.stringify(h.club)}`)
  }
  check('estimatedTotalHits 合理', r?.estimatedTotalHits > 5000, `total=${r?.estimatedTotalHits}`)
  const facet = r?.facetDistribution
  check('facetDistribution 有 6 组', facet && Object.keys(facet).length === 6, `keys=${Object.keys(facet || {})}`)
  if (facet) {
    const diffSum = facet.difficulty.reduce((s, b) => s + b.count, 0)
    check('difficulty 分桶之和=total', diffSum === r.estimatedTotalHits, `sum=${diffSum} vs ${r.estimatedTotalHits}`)
    console.log(`    difficulty=${JSON.stringify(facet.difficulty.slice(0, 4))} tags 前3=${JSON.stringify(facet.tags.slice(0, 3))}`)
  }
}

console.log('2) 翻页 page=2')
{
  const { status, body } = await get('per_page=500&page=2')
  const r = body.props?.results
  check('status 200', status === 200, String(status))
  check('offset=500', r?.offset === 500, `offset=${r?.offset}`)
  check('hits.length=500', r?.hits?.length === 500, `len=${r?.hits?.length}`)
}

console.log('3) 中文搜索 q=狗')
{
  const { status, body } = await get('q=%E7%8B%97')
  const r = body.props?.results
  check('status 200', status === 200, String(status))
  check('命中 >0', r?.hits?.length > 0, `len=${r?.hits?.length}`)
  check('所有命中都含“狗”', (r?.hits ?? []).every(h =>
    (h.song || '').includes('狗') || (h.song_alt || '').includes('狗') ||
    (h.artist || '').includes('狗') || (h.description || '').includes('狗')
  ), JSON.stringify(r?.hits?.map(h => h.song).slice(0, 5)))
}

console.log('4) 组合筛选 difficulty=1,2 + tags_all（标签大小写敏感，用 facet 真实值）')
{
  // 先拿一个真实存在的标签（facet 首桶）
  const probe = await get('per_page=1')
  const realTag = probe.body.props?.results?.facetDistribution?.tags?.[0]?.value
  const { status, body } = await get(`difficulty=1&difficulty=2&tags_all=${encodeURIComponent(realTag)}`)
  const r = body.props?.results
  check('status 200', status === 200, String(status))
  check(`命中 >0（tag=${realTag}）`, r?.hits?.length > 0, `len=${r?.hits?.length}`)
  check('难度都在 1/2', (r?.hits ?? []).every(h => h.difficulty === 1 || h.difficulty === 2))
  // 官方 __contains 是 SQLite LIKE，大小写不敏感：1p 会命中 1P（与搜索 API 的 Tagsense filter 一致）
  const lower = realTag.toLowerCase()
  check('都带该标签（大小写不敏感）', (r?.hits ?? []).every(h => h.tags?.some(t => t.toLowerCase() === lower)),
    JSON.stringify(r?.hits?.filter(h => !h.tags?.some(t => t.toLowerCase() === lower)).slice(0, 2).map(h => h.tags)))
}

console.log('5) 审核口径（与官方直查逐一对比，官方数据实时变动不硬编码）')
{
  const official = async (qs) => {
    const r = await fetch('https://datasette.rhythm.cafe/rdlevels/rdlevels.json?_size=1&' + qs)
    return (await r.json()).filtered_table_rows_count
  }

  const allOfficial = await official('is_hidden__exact=0')
  const all = await get('peer_review=all&per_page=1')
  check(`all=${all.body.props?.results?.estimatedTotalHits} 与官方 ${allOfficial} 一致`,
    all.body.props?.results?.estimatedTotalHits === allOfficial)

  const peerOfficial = await official('is_hidden__exact=0&approval__gte=10')
  const peer = await get('per_page=1') // 缺省 = peer
  check(`缺省=peer=${peer.body.props?.results?.estimatedTotalHits} 与官方 ${peerOfficial} 一致`,
    peer.body.props?.results?.estimatedTotalHits === peerOfficial)

  const rejectedOfficial = await official('is_hidden__exact=0&approval__lt=0')
  const rejected = await get('peer_review=rejected&per_page=1')
  check(`rejected=${rejected.body.props?.results?.estimatedTotalHits} 与官方 ${rejectedOfficial} 一致`,
    rejected.body.props?.results?.estimatedTotalHits === rejectedOfficial)

  const pendingOfficial = await official('is_hidden__exact=0&approval__exact=0')
  const pending = await get('peer_review=pending&per_page=1')
  check(`pending=${pending.body.props?.results?.estimatedTotalHits} 与官方 ${pendingOfficial} 一致`,
    pending.body.props?.results?.estimatedTotalHits === pendingOfficial)

  check('peer+rejected+pending = all',
    all.body.props?.results?.estimatedTotalHits ===
    peer.body.props?.results?.estimatedTotalHits +
    rejected.body.props?.results?.estimatedTotalHits +
    pending.body.props?.results?.estimatedTotalHits)
}

console.log('6) per_page 钳制')
{
  const r = await get('per_page=999')
  check('999 → 500', r.body.props?.results?.limit === 500, `limit=${r.body.props?.results?.limit}`)
  const r2 = await get('per_page=0')
  check('0 → 20', r2.body.props?.results?.limit === 20, `limit=${r2.body.props?.results?.limit}`)
}

console.log('7) 直跳 page=5 (per_page=100)')
{
  const { status, body } = await get('per_page=100&page=5')
  const r = body.props?.results
  check('status 200', status === 200, String(status))
  check('offset=400', r?.offset === 400, `offset=${r?.offset}`)
  check('hits.length=100 且非重复', r?.hits?.length === 100 && r.hits.length === new Set(r.hits.map(h => h.id)).size)
  check('page 归一化: page=0 → page1', (await get('page=0&per_page=5')).body.props?.results?.offset === 0)
}

console.log('7b) 翻回看过的页（游标存在 + 数据重拉）')
{
  const p1 = await get('per_page=100&page=1')
  const p5 = await get('per_page=100&page=5')
  const back1 = await get('per_page=100&page=1')
  const back5 = await get('per_page=100&page=5')
  check('重拉 page1 有数据', back1.body.props?.results?.hits?.length === 100, `len=${back1.body.props?.results?.hits?.length}`)
  check('重拉 page5 有数据', back5.body.props?.results?.hits?.length === 100, `len=${back5.body.props?.results?.hits?.length}`)
  check('page1 内容一致', JSON.stringify(back1.body.props?.results?.hits?.map(h => h.id)) === JSON.stringify(p1.body.props?.results?.hits?.map(h => h.id)))
  check('page5 内容一致', JSON.stringify(back5.body.props?.results?.hits?.map(h => h.id)) === JSON.stringify(p5.body.props?.results?.hits?.map(h => h.id)))
}

console.log('7c) 翻页到底 + 到底后翻回')
{
  const last = await get('per_page=500&page=11') // 5083 左右的最后一条数据页（数据实时变动）
  check('page11 有数据', last.body.props?.results?.hits?.length > 0, `len=${last.body.props?.results?.hits?.length}`)
  const beyond = await get('per_page=500&page=12')
  check('page12 空且 total 与上页一致',
    beyond.body.props?.results?.hits?.length === 0 && beyond.body.props?.results?.estimatedTotalHits === last.body.props?.results?.estimatedTotalHits,
    `len=${beyond.body.props?.results?.hits?.length} total=${beyond.body.props?.results?.estimatedTotalHits}`)
  const beyond2 = await get('per_page=500&page=13')
  check('page13 空（不越界请求）', beyond2.body.props?.results?.hits?.length === 0, `len=${beyond2.body.props?.results?.hits?.length}`)
  const back2 = await get('per_page=500&page=2')
  check('到底后翻回 page2 有数据', back2.body.props?.results?.hits?.length === 500, `len=${back2.body.props?.results?.hits?.length}`)
}

console.log('8) 回归：/api/levels')
{
  const res = await fetch('http://localhost:7332/api/levels')
  const body = await res.json()
  check('/api/levels 200', res.status === 200, String(res.status))
  check('/api/levels hits=22', body.props?.results?.hits?.length === 22, `len=${body.props?.results?.hits?.length}`)
}

console.log('9) 回归：/api/db/rdlevels/rdlevels.json')
{
  const res = await fetch('http://localhost:7332/api/db/rdlevels/rdlevels.json?_size=5')
  const body = await res.json()
  check('datasette 透传 200', res.status === 200, String(res.status))
  check('rows=5', body.rows?.length === 5, `len=${body.rows?.length}`)
}

console.log('10) 边界：q + 通配符转义')
{
  // % 应作为字面量匹配，不应命中全部
  const r = await get('q=%25')
  check('q=% 不返回全表', (r.body.props?.results?.hits?.length ?? 999) < 100, `len=${r.body.props?.results?.hits?.length}`)
}

console.log(failed === 0 ? '\n全部通过 ✅' : `\n${failed} 项失败 ❌`)
process.exit(failed === 0 ? 0 : 1)