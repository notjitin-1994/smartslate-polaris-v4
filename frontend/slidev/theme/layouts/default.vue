<template>
  <div class="slidev-layout default-layout">
    <!-- Content Container -->
    <div class="content-wrapper">
      <!-- Header with Title -->
      <div v-if="$slidev.frontmatter.title" class="slide-header animate-slide-in-up">
        <div class="accent-line"></div>
        <h2 class="slide-title">{{ $slidev.frontmatter.title }}</h2>
      </div>

      <!-- Main Content -->
      <div class="slide-content animate-fade-in">
        <slot />
      </div>
    </div>

    <!-- Footer with Branding -->
    <div class="brand-logo">
      <div class="brand-logo-icon">SP</div>
      <div>
        <div>Smartslate Polaris</div>
        <div class="brand-powered-by">Powered by Solara</div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="slidev-progress">
      <div
        class="slidev-progress-bar"
        :style="{ width: `${($slidev.nav.currentPage / $slidev.nav.total) * 100}%` }"
      ></div>
    </div>

    <!-- Page Number -->
    <div class="slidev-page-number">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
  </div>
</template>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: left;
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

.slide-content {
  flex: 1;
  animation-delay: 0.1s;
}

/* Ensure all text content is left-aligned */
.slide-content :deep(p),
.slide-content :deep(ul),
.slide-content :deep(ol),
.slide-content :deep(h3),
.slide-content :deep(h4) {
  text-align: left;
}
</style>
