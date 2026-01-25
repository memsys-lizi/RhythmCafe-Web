<template>
  <div v-if="totalPages > 1" class="pagination">
    <div class="page-info">
      第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
    </div>

    <div class="page-controls">
      <!-- 上一页 -->
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        <ChevronLeft :size="20" />
      </button>

      <!-- 页码 -->
      <button
        v-for="page in visiblePages"
        :key="page"
        class="page-btn"
        :class="{ active: page === currentPage, ellipsis: page === -1 }"
        :disabled="page === -1"
        @click="page !== -1 && goToPage(page)"
      >
        {{ page === -1 ? '...' : page }}
      </button>

      <!-- 下一页 -->
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        <ChevronRight :size="20" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  currentPage: number
  totalPages: number
  maxVisible?: number
}>()

const emit = defineEmits<{
  'change': [page: number]
}>()

const maxVisible = computed(() => props.maxVisible || 5)

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = props.totalPages
  const current = props.currentPage
  const max = maxVisible.value

  if (total <= max + 2) {
    // 显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 计算显示范围
    let start = Math.max(2, current - Math.floor(max / 2))
    let end = Math.min(total - 1, start + max - 1)

    if (end - start < max - 1) {
      start = Math.max(2, end - max + 1)
    }

    // 第一页
    pages.push(1)

    // 左侧省略号
    if (start > 2) {
      pages.push(-1)
    }

    // 中间页码
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // 右侧省略号
    if (end < total - 1) {
      pages.push(-1)
    }

    // 最后一页
    pages.push(total)
  }

  return pages
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('change', page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<style scoped>
.pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl) 0;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.page-controls {
  display: flex;
  gap: var(--spacing-xs);
}

.page-btn {
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--spacing-sm);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.page-btn:not(:disabled):hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
}

.page-btn.active {
  background-color: var(--color-white);
  color: var(--color-black);
  border-color: var(--color-white);
}

.page-btn:disabled {
  opacity: 0.3;
}

.page-btn.ellipsis {
  border: none;
  background: none;
}

.page-btn svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .page-btn {
    min-width: 36px;
    height: 36px;
  }
}
</style>
