// 谱面数据类型定义
export interface Level {
  id: string
  song: string
  artist: string
  authors: string[]
  description: string
  difficulty: 0 | 1 | 2 | 3
  approval: number
  image: string
  url: string
  url2: string
  tags: string[]
  min_bpm: number
  max_bpm: number
  has_classics: boolean
  has_freetimes: boolean
  has_freezeshots: boolean
  has_holds: boolean
  has_oneshots: boolean
  has_skipshots: boolean
  has_squareshots: boolean
  has_window_dance: boolean
  seizure_warning: boolean
  single_player: boolean
  two_player: boolean
  source: string
  indexed: number
  last_updated: number
}

// API 响应类型
export interface SearchHit {
  document: Level
  highlight: {
    song?: string
    artist?: string
    authors?: string[]
    description?: string
    tags?: string[]
  }
  text_match: number
  text_match_info: {
    best_field_score: string
    best_field_weight: number
    fields_matched: number
    score: string
    tokens_matched: number
  }
}

export interface FacetCount {
  count: number
  highlighted: string
  value: string
}

export interface FacetStats {
  total_values: number
}

export interface Facet {
  counts: FacetCount[]
  field_name: string
  stats: FacetStats
}

export interface SearchResponse {
  facet_counts: Facet[]
  found: number
  hits: SearchHit[]
  out_of: number
  page: number
  request_params: Record<string, any>
  search_cutoff: boolean
  search_time_ms: number
}

// 筛选条件类型
export interface Filters {
  tags: string[]
  authors: string[]
  artists: string[]
  difficulties: string[]
  review: 'peer' | 'all'
}

// 难度标签映射
export const DIFFICULTY_LABELS: Record<number, string> = {
  0: 'Easy',
  1: 'Medium',
  2: 'Tough',
  3: 'Very Tough'
}

// 难度颜色映射
export const DIFFICULTY_COLORS: Record<number, string> = {
  0: '#10b981', // green
  1: '#3b82f6', // blue
  2: '#f59e0b', // orange
  3: '#ef4444'  // red
}
