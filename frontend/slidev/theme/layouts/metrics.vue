<template>
  <div class="slidev-layout metrics-layout">
    <!-- Content Container -->
    <div class="content-wrapper">
      <!-- Header -->
      <div v-if="$slidev.frontmatter.title" class="slide-header animate-slide-in-up">
        <div class="accent-line"></div>
        <h2 class="slide-title">{{ $slidev.frontmatter.title }}</h2>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid animate-fade-in">
        <slot />
      </div>
    </div>

    <!-- Footer -->
    <div class="brand-logo">
      <div class="brand-logo-icon">SP</div>
      <div>
        <div>SmartSlate Polaris</div>
        <div class="brand-powered-by">Powered by Solara</div>
      </div>
    </div>

    <!-- Page Number -->
    <div class="slidev-page-number">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
  </div>
</template>

<style scoped>
.metrics-layout {
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.slide-header {
  margin-bottom: var(--space-4);
}

.slide-title {
  font-size: var(--text-title);
  color: var(--primary-accent);
  font-weight: var(--font-bold);
  margin: 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
  flex: 1;
  align-items: start;
  animation-delay: 0.1s;
}

/* Enhanced metric card styles */
.metrics-grid :deep(.metric-card) {
  background: var(--glass-background);
  backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  transition: all var(--duration-base) var(--ease);
  position: relative;
  overflow: hidden;
}

.metrics-grid :deep(.metric-card)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-accent) 0%, var(--secondary-accent) 100%);
}

.metrics-grid :deep(.metric-card):hover {
  transform: translateY(-4px);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 16px 32px rgba(0, 0, 0, 0.15);
  border-color: rgba(167, 218, 219, 0.3);
}

.metrics-grid :deep(.metric-value) {
  font-family: 'Quicksand', sans-serif;
  font-size: 3rem;
  font-weight: var(--font-bold);
  color: var(--primary-accent);
  margin-bottom: var(--space-2);
  line-height: 1;
}

.metrics-grid :deep(.metric-label) {
  font-size: var(--text-body);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: var(--font-medium);
}

.metrics-grid :deep(.metric-subtitle) {
  font-size: var(--text-caption);
  color: var(--text-disabled);
  margin-top: var(--space-1);
}

/* Staggered animations for metric cards */
.metrics-grid :deep(.metric-card):nth-child(1) {
  animation: scaleIn 0.5s var(--ease) 0.2s backwards;
}

.metrics-grid :deep(.metric-card):nth-child(2) {
  animation: scaleIn 0.5s var(--ease) 0.3s backwards;
}

.metrics-grid :deep(.metric-card):nth-child(3) {
  animation: scaleIn 0.5s var(--ease) 0.4s backwards;
}

.metrics-grid :deep(.metric-card):nth-child(4) {
  animation: scaleIn 0.5s var(--ease) 0.5s backwards;
}
</style>
