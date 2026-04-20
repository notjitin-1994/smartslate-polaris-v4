<template>
  <div class="slidev-layout section-layout">
    <!-- Animated Background -->
    <div class="section-gradient"></div>

    <!-- Content Container -->
    <div class="section-content">
      <!-- Section Number -->
      <div v-if="$slidev.frontmatter.sectionNumber" class="section-number animate-scale-in">
        {{ $slidev.frontmatter.sectionNumber }}
      </div>

      <!-- Title -->
      <div class="section-header animate-slide-in-up">
        <div class="accent-line-thick"></div>
        <h1 class="section-title">
          <slot name="title">{{ $slidev.frontmatter.title }}</slot>
        </h1>
        <p v-if="$slidev.frontmatter.subtitle" class="section-subtitle">
          {{ $slidev.frontmatter.subtitle }}
        </p>
      </div>

      <!-- Additional Content -->
      <div class="section-body animate-fade-in">
        <slot />
      </div>
    </div>

    <!-- Branding -->
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
.section-layout {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
}

.section-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(167, 218, 219, 0.2) 0%, transparent 70%),
    linear-gradient(135deg, #020c1b 0%, #0d1b2a 50%, #142433 100%);
  z-index: 0;
}

.section-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

.section-number {
  font-family: 'Quicksand', sans-serif;
  font-size: 8rem;
  font-weight: var(--font-bold);
  color: rgba(167, 218, 219, 0.15);
  line-height: 1;
  margin-bottom: calc(-1 * var(--space-4));
  animation-delay: 0s;
}

.section-header {
  margin-bottom: var(--space-6);
  animation-delay: 0.1s;
}

.accent-line-thick {
  height: 6px;
  width: 120px;
  background: linear-gradient(90deg, var(--primary-accent) 0%, var(--secondary-accent) 100%);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-3);
}

.section-title {
  font-size: 3.5rem;
  font-weight: var(--font-bold);
  line-height: 1.1;
  margin-bottom: var(--space-2);
  background: linear-gradient(135deg, var(--primary-accent) 0%, white 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-subtitle {
  font-size: var(--text-heading);
  color: var(--text-secondary);
  margin: 0;
}

.section-body {
  font-size: var(--text-body);
  color: var(--text-secondary);
  animation-delay: 0.2s;
}
</style>
