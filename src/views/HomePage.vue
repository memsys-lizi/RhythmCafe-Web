<template>
  <div class="home-page">
    <!-- 搜索栏 -->
    <SearchBar @search="handleSearch" />

    <!-- 筛选按钮 -->
    <div class="container">
      <button class="filter-toggle-btn" @click="toggleSidebar">
        <SlidersHorizontal :size="20" />
        筛选
      </button>
    </div>

    <!-- 主内容区 -->
    <div class="container">
      <!-- 加载骨架屏 -->
      <div v-if="loading" class="levels-grid">
        <SkeletonCard v-for="i in 8" :key="i" />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
      </div>

      <!-- 谱面列表 -->
      <div v-else-if="levels.length > 0" class="levels-grid">
        <LevelCard
          v-for="level in levels"
          :key="level.id"
          :level="level"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <p>没有找到符合条件的谱面</p>
      </div>

      <!-- 分页 -->
      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SlidersHorizontal } from 'lucide-vue-next'
import SearchBar from '@/components/common/SearchBar.vue'
import LevelCard from '@/components/common/LevelCard.vue'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import Pagination from '@/components/common/Pagination.vue'
import type { Level, Facet } from '@/types'
import { ApiService } from '@/services/api'
import { useFilters } from '@/composables/useFilters'

const emit = defineEmits<{
  'toggle-sidebar': []
  'update-filters': [filters: any, facetData: Facet[]]
}>()

// 使用筛选器 composable
const {
  filters,
  facetData,
  tagOptions,
  authorOptions,
  artistOptions,
  difficultyOptions,
  updateFacetData
} = useFilters()

// 状态
const loading = ref(false)
const error = ref('')
const levels = ref<Level[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const totalResults = ref(0)
const searchQuery = ref('')

// 加载谱面数据
const loadLevels = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await ApiService.fetchLevels(
      currentPage.value,
      searchQuery.value,
      filters.value
    )

    if (response) {
      levels.value = response.hits.map(hit => hit.document)
      totalResults.value = response.found
      totalPages.value = Math.ceil(response.found / 25)

      // 更新 facet 数据
      if (response.facet_counts) {
        updateFacetData(response.facet_counts)
        // 通知父组件更新筛选器数据
        emit('update-filters', filters.value, response.facet_counts)
      }
    } else {
      error.value = '获取谱面数据失败，请稍后再试'
    }
  } catch (err) {
    error.value = '获取谱面数据失败，请稍后再试'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = (query: string) => {
  searchQuery.value = query
  currentPage.value = 1
  loadLevels()
}

// 分页处理
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadLevels()
}

// 切换侧边栏
const toggleSidebar = () => {
  emit('toggle-sidebar')
}

// 应用筛选
const applyFilters = () => {
  currentPage.value = 1
  loadLevels()
}

// 暴露方法给父组件
defineExpose({
  applyFilters,
  filters,
  facetData,
  tagOptions,
  authorOptions,
  artistOptions,
  difficultyOptions
})

// 初始加载
onMounted(() => {
  loadLevels()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: var(--spacing-xl);
  transition: all var(--transition-fast);
}

.filter-toggle-btn:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
}

.filter-toggle-btn svg {
  width: 20px;
  height: 20px;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-primary);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .levels-grid {
    grid-template-columns: 1fr;
  }
}
</style>
