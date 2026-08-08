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
  margin-bottom: var(--spacing-xl);
}

.filter-header {
  margin-bottom: var(--spacing-md);
}

.filter-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
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
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 300px;
  overflow-y: auto;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.filter-item:hover {
  background-color: var(--bg-hover);
}

.filter-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-white);
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
