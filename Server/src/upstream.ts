const upstreamBaseUrl = process.env.RHYTHM_CAFE_BASE_URL ?? 'https://rhythm.cafe'
const upstreamUserAgent = process.env.UPSTREAM_USER_AGENT ?? 'RhythmCafeProxy/0.1'

const forwardedQueryKeys = [
  'q',
  'page',
  'tags_all',
  'authors_all',
  'artists_all',
  'difficulty',
  'min_bpm',
  'max_bpm',
  'peer_review'
] as const

type UpstreamQuery = Record<string, unknown>

function queryValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(queryValues)
  }

  if (value === undefined || value === null) {
    return []
  }

  const text = String(value).trim()
  return text ? [text] : []
}

export function buildLevelsUrl(query: UpstreamQuery): URL {
  const url = new URL('/levels/', upstreamBaseUrl)
  url.searchParams.set('_bridge', '1')

  for (const key of forwardedQueryKeys) {
    for (const value of queryValues(query[key])) {
      url.searchParams.append(key, value)
    }
  }

  return url
}

export async function fetchUpstreamLevels(query: UpstreamQuery): Promise<Response> {
  return fetch(buildLevelsUrl(query), {
    headers: {
      accept: '*/*',
      referer: `${upstreamBaseUrl}/`,
      'user-agent': upstreamUserAgent
    },
    signal: AbortSignal.timeout(15_000)
  })
}

export function buildDownloadUrl(id: string): URL {
  if (!/^[A-Za-z0-9]{1,64}$/.test(id)) {
    throw new Error('Invalid level id')
  }

  return new URL(`/levels/${id}/download/`, upstreamBaseUrl)
}

export async function fetchUpstreamDownload(
  id: string,
  range?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    accept: 'application/octet-stream',
    referer: `${upstreamBaseUrl}/`,
    'user-agent': upstreamUserAgent
  }

  if (range) {
    headers.range = range
  }

  return fetch(buildDownloadUrl(id), {
    headers,
    signal: AbortSignal.timeout(60_000)
  })
}
