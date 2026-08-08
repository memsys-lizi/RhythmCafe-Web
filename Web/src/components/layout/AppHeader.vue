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

        <!-- Mobile Menu Toggle -->
        <button
          class="mobile-menu-btn"
          aria-label="打开筛选"
          @click="$emit('toggle-sidebar')"
        >
          <Menu :size="24" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import type { PageName } from '@/composables/useRouter'

defineProps<{
  currentPage: PageName
}>()

defineEmits<{
  'toggle-sidebar': []
  'navigate': [page: PageName]
}>()
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
}
</style>
