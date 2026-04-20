<template>
  <div class="slidev-layout table-layout">
    <!-- Content Container -->
    <div class="content-wrapper">
      <!-- Header -->
      <div v-if="$slidev.frontmatter.title" class="slide-header animate-slide-in-up">
        <div class="accent-line"></div>
        <h2 class="slide-title">{{ $slidev.frontmatter.title }}</h2>
      </div>

      <!-- Table Content -->
      <div class="table-content animate-fade-in">
        <slot />
      </div>
    </div>

    <!-- Footer -->
    <div class="brand-logo">
      <div class="brand-logo-icon">SP</div>
      <div>
        <div>Smartslate Polaris</div>
        <div class="brand-powered-by">Powered by Solara</div>
      </div>
    </div>

    <!-- Page Number -->
    <div class="slidev-page-number">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
  </div>
</template>

<style scoped>
.table-layout {
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

.table-content {
  flex: 1;
  overflow-y: auto;
  animation-delay: 0.1s;
}

/* Enhanced table styles for this layout */
.table-content :deep(table) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--glass-background);
  backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 10px 20px rgba(0, 0, 0, 0.15);
}

.table-content :deep(thead) {
  background: linear-gradient(
    135deg,
    var(--primary-accent-dark) 0%,
    var(--secondary-accent-dark) 100%
  );
}

.table-content :deep(th) {
  padding: var(--space-3) var(--space-3);
  font-family: 'Quicksand', sans-serif;
  font-weight: var(--font-semibold);
  font-size: var(--text-body);
  color: var(--text-primary);
  text-align: left;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.table-content :deep(td) {
  padding: var(--space-3) var(--space-3);
  font-size: var(--text-body);
  color: var(--text-secondary);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: left;
}

.table-content :deep(tbody tr) {
  transition: background var(--duration-fast) var(--ease);
}

.table-content :deep(tbody tr:hover) {
  background: rgba(167, 218, 219, 0.08);
}

.table-content :deep(tbody tr:nth-child(even)) {
  background: rgba(255, 255, 255, 0.02);
}

.table-content :deep(tbody tr:nth-child(even):hover) {
  background: rgba(167, 218, 219, 0.08);
}

/* Animated entrance for table rows */
.table-content :deep(tbody tr) {
  animation: slideInLeft 0.5s var(--ease) backwards;
}

.table-content :deep(tbody tr):nth-child(1) {
  animation-delay: 0.1s;
}
.table-content :deep(tbody tr):nth-child(2) {
  animation-delay: 0.15s;
}
.table-content :deep(tbody tr):nth-child(3) {
  animation-delay: 0.2s;
}
.table-content :deep(tbody tr):nth-child(4) {
  animation-delay: 0.25s;
}
.table-content :deep(tbody tr):nth-child(5) {
  animation-delay: 0.3s;
}
.table-content :deep(tbody tr):nth-child(6) {
  animation-delay: 0.35s;
}
</style>
