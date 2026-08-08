<template>
  <footer class="app-footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-info">
          <h3>Rhythm Cafe</h3>
          <p>节奏医生谱面中转站</p>
        </div>
        <div class="footer-copyright">
          <p>© 2026 本站仅作为谱面中转站使用</p>
          <p>所有谱面版权归原作者所有</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  margin-top: auto;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xl) 0;
  gap: var(--spacing-lg);
}

.footer-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.footer-info p {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin: 0;
}

.footer-copyright {
  text-align: right;
}

.footer-copyright p {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
    padding: var(--spacing-lg) 0;
  }

  .footer-copyright {
    text-align: center;
  }
}
</style>
