<template>
  <div v-if="isModalOpen" class="mod-modal-backdrop" @click.self="closeConnectionModal">
    <section
      class="mod-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mod-modal-title"
    >
      <div class="mod-modal-header">
        <div>
          <p class="mod-modal-eyebrow">RhythmCafe Bridge</p>
          <h2 id="mod-modal-title">游戏 Mod 连接</h2>
        </div>
        <button class="mod-close-btn" type="button" aria-label="关闭" @click="closeConnectionModal">
          <X :size="20" />
        </button>
      </div>

      <div class="mod-status-panel" :class="statusClass">
        <CheckCircle2 v-if="status === 'connected'" :size="22" />
        <AlertCircle v-else :size="22" />
        <div>
          <strong>{{ statusLabel }}</strong>
          <p v-if="status === 'connected'">网页已经可以把谱面发送到游戏。</p>
          <p v-else>请启动安装了 RhythmCafe Bridge 的 Rhythm Doctor。</p>
        </div>
      </div>

      <dl v-if="health" class="mod-health-list">
        <div>
          <dt>Mod 版本</dt>
          <dd>{{ health.modVersion }}</dd>
        </div>
        <div>
          <dt>游戏场景</dt>
          <dd>{{ health.scene || '正在加载' }}</dd>
        </div>
        <div>
          <dt>桥接端口</dt>
          <dd>{{ health.port }}</dd>
        </div>
        <div>
          <dt>当前任务</dt>
          <dd>{{ health.busy ? '正在处理谱面' : '空闲' }}</dd>
        </div>
      </dl>

      <div v-else class="mod-help">
        <p>使用步骤：</p>
        <ol>
          <li>确认 BepInEx 已安装到 Rhythm Doctor。</li>
          <li>把 RhythmCafeBridge 放入 BepInEx/plugins。</li>
          <li>启动游戏后回到这里重新检测。</li>
        </ol>
      </div>

      <div class="mod-modal-actions">
        <button class="mod-retry-btn" type="button" :disabled="status === 'checking'" @click="retry">
          <RefreshCw :size="16" :class="{ spinning: status === 'checking' }" />
          重新检测
        </button>
        <button class="mod-done-btn" type="button" @click="closeConnectionModal">完成</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-vue-next'
import { useModBridge } from '@/composables/useModBridge'

const {
  status,
  statusLabel,
  health,
  isModalOpen,
  checkConnection,
  closeConnectionModal,
} = useModBridge()

const statusClass = computed(() => `status-${status.value}`)

const retry = async () => {
  await checkConnection()
}
</script>

<style scoped>
.mod-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(5px);
}

.mod-modal {
  width: min(100%, 440px);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
}

.mod-modal-header,
.mod-modal-actions,
.mod-health-list > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mod-modal-header {
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.mod-modal-eyebrow {
  margin-bottom: var(--spacing-xs);
  color: var(--text-tertiary);
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mod-modal h2 {
  font-size: 1.25rem;
}

.mod-close-btn {
  display: flex;
  padding: var(--spacing-xs);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
}

.mod-close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.mod-status-panel {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
}

.mod-status-panel strong {
  display: block;
  margin-bottom: 2px;
}

.mod-status-panel p,
.mod-help,
.mod-health-list,
.mod-help ol {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.mod-status-panel p {
  margin: 0;
}

.status-connected {
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.08);
}

.status-checking {
  color: var(--color-warning);
  background: rgba(245, 158, 11, 0.08);
}

.status-disconnected,
.status-unknown {
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.08);
}

.mod-health-list {
  display: grid;
  gap: var(--spacing-sm);
  margin: var(--spacing-lg) 0;
}

.mod-health-list > div {
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-primary);
}

.mod-health-list dt {
  color: var(--text-tertiary);
}

.mod-health-list dd {
  margin: 0;
  color: var(--text-primary);
  text-align: right;
}

.mod-help {
  margin: var(--spacing-lg) 0;
}

.mod-help p {
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.mod-help ol {
  display: grid;
  gap: var(--spacing-xs);
  padding-left: var(--spacing-lg);
}

.mod-modal-actions {
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.mod-retry-btn,
.mod-done-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  min-height: 38px;
  padding: 0 var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
}

.mod-retry-btn {
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
}

.mod-done-btn {
  color: var(--color-black);
  background: var(--color-white);
}

.mod-retry-btn:hover {
  background: var(--bg-hover);
}

.mod-done-btn:hover {
  background: var(--color-gray-200);
}

.spinning {
  animation: mod-spin 0.8s linear infinite;
}

@keyframes mod-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
