<template>
  <div class="about-page">
    <!-- Hero 区域 -->
    <section class="about-hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-icon">
            <CheckCircle :size="48" />
          </div>
          <h1 class="hero-title">关于我们</h1>
          <p class="hero-subtitle">节奏医生谱面中转站</p>
        </div>
      </div>
    </section>

    <!-- 内容区域 -->
    <section class="about-content">
      <div class="container">
        <!-- 站点声明 -->
        <div class="content-card">
          <div class="card-header">
            <Info :size="24" />
            <h2>站点声明</h2>
          </div>
          <div class="card-body">
            <p>节奏医生中文 Cafe 站是一个<span class="highlight">非官方</span>的中转代理站点，专为中国大陆地区的玩家提供更快速的谱面访问服务。</p>
            <p>本站<span class="highlight">仅作为数据中转站</span>使用，不对任何内容进行修改或处理。所有谱面、图像、音频及相关内容的版权均归原作者和源站所有。</p>
            <p>我们不对任何内容负责，也不主张对这些内容的任何所有权。如有版权疑问，请直接联系源站或原作者。</p>
          </div>
        </div>

        <!-- 技术说明 -->
        <div class="content-card">
          <div class="card-header">
            <Code :size="24" />
            <h2>技术说明</h2>
          </div>
          <div class="card-body">
            <p>本站通过服务器中转技术，加速用户对国外谱面资源的访问速度，实现以下功能：</p>
            <ul class="feature-list">
              <li>
                <Check :size="20" />
                <span>谱面数据高速中转</span>
              </li>
              <li>
                <Check :size="20" />
                <span>谱面文件下载加速</span>
              </li>
              <li>
                <Check :size="20" />
                <span>完整的谱面搜索功能</span>
              </li>
              <li>
                <Check :size="20" />
                <span>多维度筛选系统</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, Info, Code, Check } from 'lucide-vue-next'
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  padding-bottom: var(--spacing-2xl);
}

.about-hero {
  padding: var(--spacing-2xl) 0;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-bottom: 1px solid var(--border-primary);
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: fadeIn 0.6s ease-out;
}

.hero-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-gray-700), var(--color-gray-600));
  border-radius: var(--radius-xl);
  margin-bottom: var(--spacing-lg);
  animation: slideInLeft 0.6s ease-out;
}

.hero-icon svg {
  width: 48px;
  height: 48px;
  color: var(--text-primary);
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
}

.about-content {
  padding: var(--spacing-2xl) 0;
}

.content-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  animation: fadeIn 0.6s ease-out;
  transition: all var(--transition-base);
}

.content-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-primary);
}

.card-header svg {
  width: 24px;
  height: 24px;
  color: var(--text-secondary);
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.card-body {
  line-height: 1.8;
}

.card-body p {
  margin-bottom: var(--spacing-md);
  color: var(--text-secondary);
}

.highlight {
  color: var(--text-primary);
  font-weight: 600;
}

.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--bg-tertiary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.feature-list li:hover {
  background-color: var(--bg-hover);
  transform: translateX(4px);
}

.feature-list svg {
  width: 20px;
  height: 20px;
  color: var(--color-success);
  flex-shrink: 0;
}

.feature-list span {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .content-card {
    padding: var(--spacing-lg);
  }
}
</style>
