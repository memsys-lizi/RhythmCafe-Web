import type { SearchResponse, Filters } from '@/types'

// 使用你的代理站点 API
const API_BASE_URL = 'https://cafe.rhythmdoctor.top/api'

export class ApiService {
  /**
   * 获取谱面列表
   */
  static async fetchLevels(
    page: number = 1,
    query: string = '',
    filters: Filters,
    sortBy: string = '',
    facetQuery: string = ''
  ): Promise<SearchResponse | null> {
    try {
      const params = new URLSearchParams()

      // 基础参数
      params.append('q', query)
      params.append('page', String(page))
      params.append('per_page', '25')
      params.append('query_by', 'song,authors,artist,tags,description')
      params.append('query_by_weights', '12,8,6,5,4')
      params.append('facet_by', 'authors,tags,source,difficulty,artist')
      params.append('max_facet_values', '10')
      params.append('num_typos', '2,1,1,1,0')

      // Facet 查询
      if (facetQuery) {
        params.append('facet_query', facetQuery)
      }

      // 排序
      if (sortBy) {
        params.append('sort_by', sortBy)
      } else {
        const defaultSort = filters.review === 'all'
          ? '_text_match:desc,last_updated:desc'
          : '_text_match:desc,indexed:desc,last_updated:desc'
        params.append('sort_by', defaultSort)
      }

      // 构建筛选条件
      let filterBy = filters.review === 'peer'
        ? 'approval:=[10..20]'
        : 'approval:=[-1..20]'

      if (filters.difficulties.length > 0) {
        filterBy += ` && difficulty:=[${filters.difficulties.join(',')}]`
      }

      if (filters.tags.length > 0) {
        const tagFilters = filters.tags.map(tag => `\`${tag}\``).join(',')
        filterBy += ` && tags:=[${tagFilters}]`
      }

      if (filters.authors.length > 0) {
        const authorFilters = filters.authors.map(author => `\`${author}\``).join(',')
        filterBy += ` && authors:=[${authorFilters}]`
      }

      if (filters.artists.length > 0) {
        const artistFilters = filters.artists.map(artist => `\`${artist}\``).join(',')
        filterBy += ` && artist:=[${artistFilters}]`
      }

      params.append('filter_by', filterBy)

      const response = await fetch(`${API_BASE_URL}/get_chartlist.php?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch levels:', error)
      return null
    }
  }

  /**
   * 获取下载链接
   */
  static getDownloadUrl(url: string): string {
    return `${API_BASE_URL}/download.php?url=${encodeURIComponent(url)}`
  }
}
