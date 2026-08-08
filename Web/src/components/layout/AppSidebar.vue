<template>
  <div>
    <!-- Overlay -->
    <div
      v-if="isOpen"
      class="sidebar-overlay"
      @click="$emit('close')"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'is-open': isOpen }">
      <div class="sidebar-header">
        <h2>筛选选项</h2>
        <button class="close-btn" @click="$emit('close')">
          <X :size="20" />
        </button>
      </div>

      <div class="sidebar-content">
        <slot></slot>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  'close': []
}>()
</script>

<style scoped>
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 200;
  animation: fadeIn var(--transition-fast) ease-out;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-primary);
  z-index: 201;
  transform: translateX(-100%);
  transition: transform var(--transition-base);
  display: flex;
  flex-direction: column;
}

.sidebar.is-open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
  height: var(--header-height);
}

.sidebar-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    max-width: 320px;
  }
}
</style>
