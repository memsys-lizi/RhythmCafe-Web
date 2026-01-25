<template>
  <div class="skeleton-card">
    <div class="skeleton-image"></div>
    <div class="skeleton-content">
      <div class="skeleton-title"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-meta">
        <div class="skeleton-badge"></div>
        <div class="skeleton-badge"></div>
      </div>
      <div class="skeleton-tags">
        <div class="skeleton-tag"></div>
        <div class="skeleton-tag"></div>
        <div class="skeleton-tag"></div>
      </div>
      <div class="skeleton-button"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  padding: var(--spacing-lg);
}

.skeleton-title {
  height: 20px;
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-text {
  height: 16px;
  width: 70%;
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-md);
  animation: shimmer 1.5s infinite;
}

.skeleton-meta {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.skeleton-badge {
  height: 14px;
  width: 80px;
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-tags {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.skeleton-tag {
  height: 20px;
  width: 60px;
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-button {
  height: 36px;
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-md);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
