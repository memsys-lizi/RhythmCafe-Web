<template>
  <div class="level-card">
    <!-- 封面图片 -->
    <div class="card-image">
      <img :src="imageSource" :alt="level.song" @error="handleImageError" />
      <div class="card-description">
        {{ level.description || '暂无描述' }}
      </div>
      <div class="difficulty-badge" :style="{ backgroundColor: difficultyColor }">
        {{ difficultyLabel }}
      </div>
      <div v-if="level.approval >= 10" class="peer-badge">
        <Check :size="16" />
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="card-content">
      <h3 class="card-title">{{ level.song }}</h3>
      <p class="card-artist">{{ level.artist || '未知艺术家' }}</p>

      <div class="card-meta">
        <span class="meta-item">
          <User :size="14" />
          {{ authorName }}
        </span>
        <span class="meta-item">
          <Clock :size="14" />
          {{ bpmLabel }}
        </span>
        <span v-if="level.club?.name" class="meta-item">
          {{ level.club.name }}
        </span>
      </div>

      <!-- 标签 -->
      <div class="card-tags">
        <span v-for="tag in displayTags" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>

      <!-- 下载按钮 -->
      <div class="card-actions">
        <a
          :href="getDownloadUrl(level.id)"
          class="download-btn primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download :size="16" />
          下载谱面
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Download, Check, User, Clock } from 'lucide-vue-next'
import type { Level } from '@/types'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/types'
import { ApiService } from '@/services/api'

const props = defineProps<{
  level: Level
}>()

const difficultyLabel = computed(() => DIFFICULTY_LABELS[props.level.difficulty])
const difficultyColor = computed(() => DIFFICULTY_COLORS[props.level.difficulty])
const imageSource = computed(() => props.level.thumb_url || props.level.image_url || '/favicon.svg')
const bpmLabel = computed(() => {
  if (props.level.min_bpm === props.level.max_bpm) {
    return `${props.level.min_bpm} BPM`
  }

  return `${props.level.min_bpm}-${props.level.max_bpm} BPM`
})

const authorName = computed(() => {
  return Array.isArray(props.level.authors)
    ? props.level.authors[0]
    : props.level.authors || '未知作者'
})

const displayTags = computed(() => {
  return props.level.tags?.slice(0, 4) || []
})

const getDownloadUrl = (id: string) => {
  return ApiService.getDownloadUrl(id)
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = '/favicon.svg'
}
</script>

<style scoped>
.level-card {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);
  animation: fadeIn var(--transition-base) ease-out;
  height: 100%;
}

.level-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: var(--bg-tertiary);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.card-description {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-md);
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  font-size: 0.875rem;
  line-height: 1.5;
  transform: translateY(-100%);
  transition: transform var(--transition-base);
  z-index: 2;
  max-height: 180px;
  overflow-y: auto;
  backdrop-filter: blur(8px);
}

.level-card:hover .card-image img {
  transform: scale(1.05);
}

.level-card:hover .card-description {
  transform: translateY(0);
}

.difficulty-badge {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  backdrop-filter: blur(4px);
}

.peer-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 24px;
  height: 24px;
  background-color: var(--color-success);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.peer-badge svg {
  width: 16px;
  height: 16px;
}

.card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: var(--spacing-lg);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 var(--spacing-xs) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-artist {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  min-height: 24px;
}

.tag {
  padding: 2px var(--spacing-sm);
  background-color: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.card-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: auto;
}

.download-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.download-btn.primary {
  background-color: var(--color-white);
  color: var(--color-black);
}

.download-btn.primary:hover {
  background-color: var(--color-gray-200);
}

.download-btn.secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-secondary);
}

.download-btn.secondary:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
}

.download-btn svg {
  width: 16px;
  height: 16px;
}
</style>
