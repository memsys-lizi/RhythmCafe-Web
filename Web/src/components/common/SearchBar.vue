<template>
  <div class="search-section">
    <div class="container">
      <h2 class="search-title">今天想玩什么谱面？</h2>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索谱面、作者或歌曲..."
          @keydown.enter.prevent="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">
          <Search :size="20" />
          搜索
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'

const searchQuery = ref('')

const emit = defineEmits<{
  'search': [query: string]
}>()

const handleSearch = () => {
  emit('search', searchQuery.value.trim())
}
</script>

<style scoped>
.search-section {
  padding: var(--spacing-2xl) 0;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
}

.search-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-xl);
  letter-spacing: -0.02em;
}

.search-box {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  gap: var(--spacing-sm);
}

.search-input {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
}

.search-input:focus {
  border-color: var(--border-hover);
  background-color: var(--bg-hover);
}

.search-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--color-white);
  color: var(--color-black);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.search-btn:hover {
  background-color: var(--color-gray-200);
  transform: translateY(-2px);
}

.search-btn svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .search-title {
    font-size: 1.5rem;
  }

  .search-box {
    flex-direction: column;
  }

  .search-btn {
    justify-content: center;
  }
}
</style>
