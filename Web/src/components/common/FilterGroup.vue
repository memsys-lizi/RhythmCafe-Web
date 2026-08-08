<template>
  <div class="filter-group">
    <div class="filter-header">
      <h3 class="filter-title">
        <slot name="icon"></slot>
        {{ title }}
        <span class="count">{{ totalCount }}</span>
      </h3>
    </div>

    <div v-if="searchable" class="filter-search">
      <input
        v-model="searchQuery"
        type="text"
        class="filter-search-input"
        placeholder="搜索..."
      />
    </div>

    <div class="filter-list">
      <label
        v-for="item in filteredItems"
        :key="item.value"
        class="filter-item"
      >
        <input
          type="checkbox"
          :value="item.value"
          :checked="modelValue.includes(item.value)"
          @change="handleChange(item.value)"
        />
        <span class="filter-label">
          {{ item.label }}
          <span class="filter-count">{{ item.count }}</span>
        </span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface FilterItem {
  value: string
  label: string
  count: number
}

const props = defineProps<{
  title: string
  items: FilterItem[]
  modelValue: string[]
  searchable?: boolean
  totalCount?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const searchQuery = ref('')

const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items
  const query = searchQuery.value.toLowerCase()
  return props.items.filter(item =>
    item.label.toLowerCase().includes(query)
  )
})

const handleChange = (value: string) => {
  const newValue = props.modelValue.includes(value)
    ? props.modelValue.filter(v => v !== value)
    : [...props.modelValue, value]
  emit('update:modelValue', newValue)
}
</script>

<style scoped>
.filter-group {
  margin-bottom: var(--spacing-lg);
}

.filter-header {
  margin-bottom: var(--spacing-md);
}

.filter-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.count {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.filter-search {
  margin-bottom: var(--spacing-md);
}

.filter-search-input {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  background-color: rgba(255, 255, 255, 0.04);
  border-color: var(--border-secondary);
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 260px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.6rem 0.65rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.filter-item:hover {
  background-color: rgba(255, 255, 255, 0.07);
}

.filter-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-white);
  flex: 0 0 auto;
}

.filter-label {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.filter-count {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}
</style>
