<template>
  <div class="slidev-layout timeline-layout">
    <!-- Content Container -->
    <div class="content-wrapper">
      <!-- Header -->
      <div v-if="$slidev.frontmatter.title" class="slide-header animate-slide-in-up">
        <div class="accent-line"></div>
        <h2 class="slide-title">{{ $slidev.frontmatter.title }}</h2>
      </div>

      <!-- Timeline Content -->
      <div class="timeline-content animate-fade-in">
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
.timeline-layout {
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

.timeline-content {
  flex: 1;
  padding-left: var(--space-2);
  animation-delay: 0.1s;
}

/* Enhanced timeline styles for this layout */
.timeline-content :deep(.timeline) {
  position: relative;
  padding-left: var(--space-6);
}

.timeline-content :deep(.timeline)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--primary-accent) 0%, var(--secondary-accent) 100%);
  border-radius: var(--radius-sm);
}

.timeline-content :deep(.timeline-item) {
  position: relative;
  margin-bottom: var(--space-4);
  padding-left: var(--space-4);
}

.timeline-content :deep(.timeline-item)::before {
  content: '';
  position: absolute;
  left: calc(-1 * var(--space-6) - 1.5px);
  top: 0.5rem;
  width: 16px;
  height: 16px;
  background: var(--primary-accent);
  border-radius: 50%;
  border: 3px solid var(--background-dark);
  box-shadow: 0 0 0 6px rgba(167, 218, 219, 0.2);
  animation: pulse 2s infinite;
}

.timeline-content :deep(.timeline-item):nth-child(1) {
  animation: slideInLeft 0.5s var(--ease) 0.2s backwards;
}

.timeline-content :deep(.timeline-item):nth-child(2) {
  animation: slideInLeft 0.5s var(--ease) 0.3s backwards;
}

.timeline-content :deep(.timeline-item):nth-child(3) {
  animation: slideInLeft 0.5s var(--ease) 0.4s backwards;
}

.timeline-content :deep(.timeline-item):nth-child(4) {
  animation: slideInLeft 0.5s var(--ease) 0.5s backwards;
}

.timeline-content :deep(.timeline-item):nth-child(5) {
  animation: slideInLeft 0.5s var(--ease) 0.6s backwards;
}
</style>
