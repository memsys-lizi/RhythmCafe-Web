import { computed, ref } from 'vue'
import type { FacetDistribution, Filters } from '@/types'

const createDefaultFilters = (): Filters => ({
  tags: [],
  authors: [],
  artists: [],
  difficulties: [],
  minBpm: null,
  maxBpm: null,
  review: 'peer'
})

function optionsFor(facets: FacetDistribution, key: string) {
  return (facets[key] ?? []).map(item => ({
    value: item.value,
    label: item.highlighted || item.value,
    count: item.count
  }))
}

export function useFilters() {
  const filters = ref<Filters>(createDefaultFilters())
  const facetData = ref<FacetDistribution>({})

  const tagOptions = computed(() => optionsFor(facetData.value, 'tags'))
  const authorOptions = computed(() => optionsFor(facetData.value, 'authors'))
  const artistOptions = computed(() => optionsFor(facetData.value, 'artist_tokens'))
  const difficultyOptions = computed(() => {
    const options = optionsFor(facetData.value, 'difficulty')
    return options.length > 0
      ? options.map(item => ({
        ...item,
        label: {
          '0': 'Easy',
          '1': 'Medium',
          '2': 'Tough',
          '3': 'Very Tough'
        }[item.value] ?? item.label
      }))
      : [
        { value: '0', label: 'Easy', count: 0 },
        { value: '1', label: 'Medium', count: 0 },
        { value: '2', label: 'Tough', count: 0 },
        { value: '3', label: 'Very Tough', count: 0 }
      ]
  })

  const updateFacetData = (facets: FacetDistribution) => {
    facetData.value = facets
  }

  const resetFilters = () => {
    filters.value = createDefaultFilters()
  }

  const hasActiveFilters = computed(() => {
    return filters.value.tags.length > 0 ||
      filters.value.authors.length > 0 ||
      filters.value.artists.length > 0 ||
      filters.value.difficulties.length > 0 ||
      filters.value.minBpm !== null ||
      filters.value.maxBpm !== null ||
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
