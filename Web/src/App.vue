<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppFooter from './components/layout/AppFooter.vue'
import HomePage from './views/HomePage.vue'
import AboutPage from './views/AboutPage.vue'
import FiltersContent from './components/common/FiltersContent.vue'
import { useRouter } from './composables/useRouter'
import type { FacetDistribution, Filters } from './types'

// 路由
const { currentPage, navigateTo } = useRouter()

const sidebarOpen = ref(false)
const homePageRef = ref<InstanceType<typeof HomePage>>()

// 筛选器数据
const facetData = ref<FacetDistribution>({})
const tagOptions = ref<Array<{ value: string; label: string; count: number }>>([])
const authorOptions = ref<Array<{ value: string; label: string; count: number }>>([])
const artistOptions = ref<Array<{ value: string; label: string; count: number }>>([])
const difficultyOptions = ref<Array<{ value: string; label: string; count: number }>>([])

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

// 更新筛选器数据
const handleUpdateFilters = (_newFilters: Filters, newFacetData: FacetDistribution) => {
  facetData.value = newFacetData
  if (homePageRef.value) {
    tagOptions.value = homePageRef.value.tagOptions
    authorOptions.value = homePageRef.value.authorOptions
    artistOptions.value = homePageRef.value.artistOptions
    difficultyOptions.value = homePageRef.value.difficultyOptions
  }
}

// 应用筛选
const handleApplyFilters = () => {
  if (homePageRef.value) {
    homePageRef.value.applyFilters()
  }
  closeSidebar()
}

// 重置筛选
const handleResetFilters = () => {
  if (homePageRef.value) {
    homePageRef.value.filters.tags = []
    homePageRef.value.filters.authors = []
    homePageRef.value.filters.artists = []
    homePageRef.value.filters.difficulties = []
    homePageRef.value.filters.minBpm = null
    homePageRef.value.filters.maxBpm = null
    homePageRef.value.filters.review = 'peer'
    homePageRef.value.applyFilters()
  }
  closeSidebar()
}
</script>

<template>
  <div class="app">
    <AppHeader
      :current-page="currentPage"
      @toggle-sidebar="toggleSidebar"
      @navigate="navigateTo"
    />

    <AppSidebar :is-open="sidebarOpen" @close="closeSidebar">
      <FiltersContent
        v-if="homePageRef"
        :filters="homePageRef.filters"
        :facet-data="facetData"
        :tag-options="tagOptions"
        :author-options="authorOptions"
        :artist-options="artistOptions"
        :difficulty-options="difficultyOptions"
        @apply="handleApplyFilters"
        @reset="handleResetFilters"
      />
    </AppSidebar>

    <main class="main-content">
      <Transition name="page" mode="out-in">
        <HomePage
          v-if="currentPage === 'home'"
          ref="homePageRef"
          @toggle-sidebar="toggleSidebar"
          @update-filters="handleUpdateFilters"
        />
        <AboutPage v-else-if="currentPage === 'about'" />
      </Transition>
    </main>

    <AppFooter />
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
