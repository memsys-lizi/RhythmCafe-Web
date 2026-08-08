import { ref, computed } from 'vue'
import type { Filters, Facet } from '@/types'

export function useFilters() {
  // 筛选条件
  const filters = ref<Filters>({
    tags: [],
    authors: [],
    artists: [],
    difficulties: [],
    review: 'peer'
  })

  // Facet 数据（从 API 返回）
  const facetData = ref<Facet[]>([])

  // 标签选项
  const tagOptions = computed(() => {
    const facet = facetData.value.find(f => f.field_name === 'tags')
    if (!facet) return []
    return facet.counts.map(c => ({
      value: c.value,
      label: c.value,
      count: c.count
    }))
  })

  // 作者选项
  const authorOptions = computed(() => {
    const facet = facetData.value.find(f => f.field_name === 'authors')
    if (!facet) return []
    return facet.counts.map(c => ({
      value: c.value,
      label: c.value,
      count: c.count
    }))
  })

  // 艺术家选项
  const artistOptions = computed(() => {
    const facet = facetData.value.find(f => f.field_name === 'artist')
    if (!facet) return []
    return facet.counts.map(c => ({
      value: c.value,
      label: c.value,
      count: c.count
    }))
  })

  // 难度选项
  const difficultyOptions = computed(() => {
    const facet = facetData.value.find(f => f.field_name === 'difficulty')
    if (!facet) {
      // 返回默认难度选项
      return [
        { value: '0', label: 'Easy', count: 0 },
        { value: '1', label: 'Medium', count: 0 },
        { value: '2', label: 'Tough', count: 0 },
        { value: '3', label: 'Very Tough', count: 0 }
      ]
    }
    return facet.counts.map(c => ({
      value: String(c.value),
      label: c.value === '0' ? 'Easy' :
             c.value === '1' ? 'Medium' :
             c.value === '2' ? 'Tough' : 'Very Tough',
      count: c.count
    }))
  })

  // 更新 facet 数据
  const updateFacetData = (facets: Facet[]) => {
    facetData.value = facets
  }

  // 重置筛选条件
  const resetFilters = () => {
    filters.value = {
      tags: [],
      authors: [],
      artists: [],
      difficulties: [],
      review: 'peer'
    }
  }

  // 检查是否有激活的筛选
  const hasActiveFilters = computed(() => {
    return filters.value.tags.length > 0 ||
           filters.value.authors.length > 0 ||
           filters.value.artists.length > 0 ||
           filters.value.difficulties.length > 0 ||
           filters.value.review !== 'peer'
  })

  return {
    filters,
    facetData,
    tagOptions,
    authorOptions,
    artistOptions,
    difficultyOptions,
    updateFacetData,
    resetFilters,
    hasActiveFilters
  }
}
