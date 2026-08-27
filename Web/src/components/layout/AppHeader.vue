<template>
  <header class="app-header">
    <div class="container">
      <div class="header-content">
        <!-- Logo -->
        <div class="logo">
          <div class="logo-icon">
            <img src="/favicon.svg" alt="Rhythm Cafe" />
          </div>
          <div class="logo-text">
            <h1>Rhythm Cafe</h1>
            <span class="subtitle">节奏医生谱面站</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="nav-links">
          <button
            class="nav-link"
            :class="{ active: currentPage === 'home' }"
            @click="$emit('navigate', 'home')"
          >
            首页
          </button>
          <button
            class="nav-link"
            :class="{ active: currentPage === 'about' }"
            @click="$emit('navigate', 'about')"
          >
            关于
          </button>
        </nav>

        <div class="header-actions">
          <button
            class="mod-connection-btn"
            type="button"
            :aria-label="`Mod 连接状态：${statusLabel}`"
            @click="openConnectionModal"
          >
            <span class="mod-icon-wrap">
              <Gamepad2 :size="22" aria-hidden="true" />
              <span class="mod-status-dot" :class="statusDotClass" aria-hidden="true" />
            </span>
            <span class="mod-status-text">{{ statusLabel }}</span>
          </button>

          <!-- Mobile Menu Toggle -->
          <button
            class="mobile-menu-btn"
            type="button"
            aria-label="打开筛选"
            @click="$emit('toggle-sidebar')"
          >
            <Menu :size="24" />
          </button>
        </div>
      </div>
    </div>
  </header>
  <ModConnectionModal />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Gamepad2, Menu } from 'lucide-vue-next'
import type { PageName } from '@/composables/useRouter'
import { useModBridge } from '@/composables/useModBridge'
import ModConnectionModal from '@/components/common/ModConnectionModal.vue'

defineProps<{
  currentPage: PageName
}>()

defineEmits<{
  'toggle-sidebar': []
  'navigate': [page: PageName]
}>()

const { status, statusLabel, openConnectionModal, startPolling, stopPolling } = useModBridge()

const statusDotClass = computed(() => `dot-${status.value}`)

onMounted(startPolling)
onUnmounted(stopPolling)
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  backdrop-filter: blur(10px);
  background-color: rgba(26, 26, 26, 0.8);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  gap: var(--spacing-lg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.mod-connection-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-height: 40px;
  padding: 0 var(--spacing-sm);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
}

.mod-connection-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.mod-icon-wrap {
  position: relative;
  display: inline-flex;
}

.mod-status-dot {
  position: absolute;
  top: -2px;
  right: -3px;
  width: 8px;
  height: 8px;
  border: 2px solid var(--bg-secondary);
  border-radius: var(--radius-full);
}

.dot-connected {
  background: var(--color-success);
}

.dot-checking {
  background: var(--color-warning);
}

.dot-disconnected,
.dot-unknown {
  background: var(--color-error);
}

.mod-status-text {
  font-size: 0.875rem;
  font-weight: 600;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.logo:hover {
  opacity: 0.8;
}

.logo-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: var(--radius-md);
}

.logo-icon img {
  width: 32px;
  height: 32px;
}

.logo-text h1 {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0;
}

.subtitle {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  display: block;
  margin-top: -2px;
}

.nav-links {
  display: flex;
  gap: var(--spacing-sm);
}

.nav-link {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-fast);
  position: relative;
  color: var(--text-secondary);
  background: transparent;
}

.nav-link:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.nav-link.active {
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background-color: var(--text-primary);
  border-radius: var(--radius-full);
}

.mobile-menu-btn {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  transition: background-color var(--transition-fast);
}

.mobile-menu-btn:hover {
  background-color: var(--bg-hover);
}

.mobile-menu-btn svg {
  width: 24px;
  height: 24px;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .subtitle {
    display: none;
  }

  .logo-text h1 {
    font-size: 1.1rem;
  }

  .mod-status-text {
    display: none;
  }
}
</style>
