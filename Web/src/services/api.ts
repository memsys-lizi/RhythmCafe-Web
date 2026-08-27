import type {
  Filters,
  FacetDistribution,
  LevelSearchResult,
  UpstreamResponse
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

function appendValues(params: URLSearchParams, key: string, values: string[]) {
  for (const value of values) {
    if (value.trim()) {
      params.append(key, value)
    }
  }
}

function normalizeFacets(facets: FacetDistribution | undefined): FacetDistribution {
  if (!facets || typeof facets !== 'object') {
    return {}
  }

  return Object.fromEntries(
    Object.entries(facets).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : []
    ])
  )
}

export class ApiService {
  static async fetchLevels(
    page: number = 1,
    query: string = '',
    filters: Filters,
    perPage: number = 20
  ): Promise<LevelSearchResult> {
    const params = new URLSearchParams()
    const normalizedQuery = query.trim()

    if (normalizedQuery) {
      params.set('q', normalizedQuery)
    }

    params.set('page', String(page))
    params.set('per_page', String(perPage))
    appendValues(params, 'tags_all', filters.tags)
    appendValues(params, 'authors_all', filters.authors)
    appendValues(params, 'artists_all', filters.artists)
    appendValues(params, 'difficulty', filters.difficulties)

    if (filters.minBpm !== null) {
      params.set('min_bpm', String(filters.minBpm))
    }

    if (filters.maxBpm !== null) {
      params.set('max_bpm', String(filters.maxBpm))
    }

    if (filters.review !== 'peer') {
      params.set(
        'peer_review',
        filters.review === 'non-refereed' ? 'rejected' : filters.review
      )
    }

    const response = await fetch(`${API_BASE_URL}/levels/db?${params.toString()}`, {
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json() as UpstreamResponse
    const results = data.props?.results

    if (!results || !Array.isArray(results.hits)) {
      throw new Error('API response has an unexpected shape')
    }

    const pageSize = Number(results.limit) > 0 ? Number(results.limit) : 20
    const offset = Number(results.offset) >= 0 ? Number(results.offset) : 0

    return {
      levels: results.hits,
      totalResults: Number(results.estimatedTotalHits) || 0,
      page: Math.floor(offset / pageSize) + 1,
      pageSize,
      facets: normalizeFacets(results.facetDistribution)
    }
  }

  static getDownloadUrl(id: string): string {
    return `${API_BASE_URL}/levels/${encodeURIComponent(id)}/download`
  }

  static getAbsoluteDownloadUrl(id: string): string {
    const url = this.getDownloadUrl(id)

    if (typeof window === 'undefined') {
      return url
    }

    return new URL(url, window.location.origin).toString()
  }
}
