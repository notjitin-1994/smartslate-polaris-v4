<template>
  <div class="slidev-layout two-cols-layout">
    <!-- Content Container -->
    <div class="content-wrapper">
      <!-- Header -->
      <div v-if="$slidev.frontmatter.title" class="slide-header animate-slide-in-up">
        <div class="accent-line"></div>
        <h2 class="slide-title">{{ $slidev.frontmatter.title }}</h2>
      </div>

      <!-- Two Column Grid -->
      <div class="two-cols-grid animate-fade-in">
        <!-- Left Column -->
        <div class="glass-card col-left">
          <slot name="left">
            <slot />
          </slot>
        </div>

        <!-- Right Column -->
        <div class="glass-card col-right">
          <slot name="right" />
        </div>
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
.two-cols-layout {
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

.two-cols-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  flex: 1;
  animation-delay: 0.1s;
}

.col-left,
.col-right {
  padding: var(--space-4);
  height: 100%;
  overflow-y: auto;
}

.col-left {
  animation: slideInLeft 0.5s var(--ease) 0.2s backwards;
}

.col-right {
  animation: slideInLeft 0.5s var(--ease) 0.3s backwards;
}

/* Left-align all content */
.col-left :deep(*),
.col-right :deep(*) {
  text-align: left;
}
</style>
