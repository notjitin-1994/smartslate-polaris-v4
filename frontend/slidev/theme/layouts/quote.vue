<template>
  <div class="slidev-layout quote-layout">
    <!-- Animated Background -->
    <div class="quote-gradient"></div>

    <!-- Content Container -->
    <div class="quote-content">
      <!-- Large Quote Mark -->
      <div class="quote-mark animate-scale-in">"</div>

      <!-- Quote Text -->
      <div class="quote-text animate-slide-in-up">
        <slot />
      </div>

      <!-- Attribution -->
      <div v-if="$slidev.frontmatter.author" class="quote-attribution animate-fade-in">
        <div class="attribution-line"></div>
        <div class="attribution-text">{{ $slidev.frontmatter.author }}</div>
        <div v-if="$slidev.frontmatter.role" class="attribution-role">
          {{ $slidev.frontmatter.role }}
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
.quote-layout {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  text-align: center;
}

.quote-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(167, 218, 219, 0.15) 0%, transparent 60%),
    linear-gradient(135deg, #020c1b 0%, #0d1b2a 50%, #142433 100%);
  z-index: 0;
}

.quote-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  padding: var(--space-6);
}

.quote-mark {
  font-family: 'Quicksand', sans-serif;
  font-size: 12rem;
  font-weight: var(--font-bold);
  color: rgba(167, 218, 219, 0.2);
  line-height: 0.8;
  margin-bottom: var(--space-3);
  animation-delay: 0s;
}

.quote-text {
  font-size: 2rem;
  font-weight: var(--font-medium);
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: var(--space-6);
  font-style: italic;
  animation-delay: 0.2s;
}

.quote-text :deep(p) {
  font-size: 2rem;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--space-2);
}

.quote-attribution {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  animation-delay: 0.4s;
}

.attribution-line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--primary-accent) 50%, transparent 100%);
}

.attribution-text {
  font-family: 'Quicksand', sans-serif;
  font-size: var(--text-heading);
  font-weight: var(--font-semibold);
  color: var(--primary-accent);
}

.attribution-role {
  font-size: var(--text-body);
  color: var(--text-secondary);
  font-style: normal;
}
</style>
