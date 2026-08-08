<template>
  <div class="filters-content">
    <!-- 标签筛选 -->
    <FilterGroup
      title="标签"
      :items="tagOptions"
      v-model="filters.tags"
      :searchable="true"
      :total-count="tagTotalCount"
    >
      <template #icon>
        <Tag :size="14" />
      </template>
    </FilterGroup>

    <!-- 作者筛选 -->
    <FilterGroup
      title="作者"
      :items="authorOptions"
      v-model="filters.authors"
      :searchable="true"
      :total-count="authorTotalCount"
    >
      <template #icon>
        <Users :size="14" />
      </template>
    </FilterGroup>

    <!-- 艺术家筛选 -->
    <FilterGroup
      title="艺术家"
      :items="artistOptions"
      v-model="filters.artists"
      :searchable="true"
      :total-count="artistTotalCount"
    >
      <template #icon>
        <Music :size="14" />
      </template>
    </FilterGroup>

    <!-- 难度筛选 -->
    <FilterGroup
      title="难度"
      :items="difficultyOptions"
      v-model="filters.difficulties"
      :searchable="false"
      :total-count="4"
    >
      <template #icon>
        <TrendingUp :size="14" />
      </template>
    </FilterGroup>

    <!-- 同行评审筛选 -->
    <div class="filter-group">
      <div class="filter-header">
        <h3 class="filter-title">
          <CheckCircle :size="14" />
          同行评审
        </h3>
      </div>
      <div class="review-options">
        <label class="review-option">
          <input
            type="radio"
            value="peer"
            v-model="filters.review"
          />
          <span>仅同行评审谱面</span>
        </label>
        <label class="review-option">
          <input
            type="radio"
            value="all"
            v-model="filters.review"
          />
          <span>所有谱面</span>
        </label>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="filter-actions">
      <button class="apply-btn" @click="$emit('apply')">
        应用筛选
      </button>
      <button class="reset-btn" @click="$emit('reset')">
        重置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tag, Users, Music, TrendingUp, CheckCircle } from 'lucide-vue-next'
import FilterGroup from './FilterGroup.vue'
import type { Filters, Facet } from '@/types'

const props = defineProps<{
  filters: Filters
  facetData: Facet[]
  tagOptions: Array<{ value: string; label: string; count: number }>
  authorOptions: Array<{ value: string; label: string; count: number }>
  artistOptions: Array<{ value: string; label: string; count: number }>
  difficultyOptions: Array<{ value: string; label: string; count: number }>
}>()

defineEmits<{
  'apply': []
  'reset': []
}>()

const tagTotalCount = computed(() => {
  const facet = props.facetData.find(f => f.field_name === 'tags')
  return facet?.stats.total_values || 0
})

const authorTotalCount = computed(() => {
  const facet = props.facetData.find(f => f.field_name === 'authors')
  return facet?.stats.total_values || 0
})

const artistTotalCount = computed(() => {
  const facet = props.facetData.find(f => f.field_name === 'artist')
  return facet?.stats.total_values || 0
})
</script>

<style scoped>
.filters-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.review-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.review-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.review-option:hover {
  background-color: var(--bg-hover);
}

.review-option input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-white);
}

.review-option span {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.filter-actions {
  display: flex;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-primary);
}

.apply-btn,
.reset-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.apply-btn {
  background-color: var(--color-white);
  color: var(--color-black);
}

.apply-btn:hover {
  background-color: var(--color-gray-200);
  transform: translateY(-1px);
}

.reset-btn {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-secondary);
}

.reset-btn:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
}
</style>
