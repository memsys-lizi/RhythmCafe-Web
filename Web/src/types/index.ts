// Rhythm Café 关卡数据
export interface Level {
  id: string
  song: string
  song_alt: string
  artist: string
  authors: string[]
  description: string
  difficulty: 0 | 1 | 2 | 3
  approval: number
  image_url: string
  thumb_url: string
  icon_url: string
  rdzip_url: string
  tags: string[]
  min_bpm: number
  max_bpm: number
  last_updated: string
  seizure_warning: boolean
  single_player: boolean
  two_player: boolean
  is_animated: boolean
  is_private: boolean
  is_hidden: boolean
  total_hits_approx: number
  submitter?: {
    id: string
    displayName: string
  }
  club?: {
    id: string
    name: string
  }
  has_classics: boolean
  has_freetimes: boolean
  has_freezeshots: boolean
  has_holds: boolean
  has_oneshots: boolean
  has_skipshots: boolean
  has_squareshots: boolean
  has_window_dance: boolean
}

export interface FacetCount {
  count: number
  highlighted: string
  value: string
}

export type FacetDistribution = Record<string, FacetCount[]>

export interface UpstreamResults {
  hits: Level[]
  estimatedTotalHits: number
  processingTimeMs: number
  limit: number
  offset: number
  query: string
  facetDistribution: FacetDistribution
}

export interface UpstreamResponse {
  action: string
  view: string
  overlay: boolean
  metadata: {
    title: string
  }
  props: {
    results: UpstreamResults
  }
  context?: Record<string, unknown>
  messages?: unknown[]
}

export interface LevelSearchResult {
  levels: Level[]
  totalResults: number
  page: number
  pageSize: number
  facets: FacetDistribution
}

export type ReviewFilter = 'peer' | 'pending' | 'non-refereed' | 'all'

export interface Filters {
  tags: string[]
  authors: string[]
  artists: string[]
  difficulties: string[]
  minBpm: number | null
  maxBpm: number | null
  review: ReviewFilter
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  0: 'Easy',
  1: 'Medium',
  2: 'Tough',
  3: 'Very Tough'
}

export const DIFFICULTY_COLORS: Record<number, string> = {
  0: '#10b981',
  1: '#3b82f6',
  2: '#f59e0b',
  3: '#ef4444'
}
