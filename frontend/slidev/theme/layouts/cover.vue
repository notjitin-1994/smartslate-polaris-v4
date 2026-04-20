<template>
  <div class="slidev-layout cover-layout">
    <!-- Animated Background Gradient -->
    <div class="animated-gradient"></div>

    <!-- Content Container -->
    <div class="cover-content">
      <!-- Title Section -->
      <div class="cover-header animate-slide-in-up">
        <div class="accent-line"></div>
        <h1 class="cover-title">
          <slot name="title">{{ $slidev.frontmatter.title }}</slot>
        </h1>
        <p v-if="$slidev.frontmatter.subtitle" class="cover-subtitle">
          {{ $slidev.frontmatter.subtitle }}
        </p>
      </div>

      <!-- Metadata Cards -->
      <div class="cover-metadata animate-fade-in">
        <div class="glass-card metadata-card" v-if="$slidev.frontmatter.author">
          <div class="metadata-label">Created By</div>
          <div class="metadata-value">{{ $slidev.frontmatter.author }}</div>
        </div>
        <div class="glass-card metadata-card" v-if="$slidev.frontmatter.date">
          <div class="metadata-label">Date</div>
          <div class="metadata-value">{{ $slidev.frontmatter.date }}</div>
        </div>
        <div class="glass-card metadata-card" v-if="$slidev.frontmatter.duration">
          <div class="metadata-label">Duration</div>
          <div class="metadata-value">{{ $slidev.frontmatter.duration }}</div>
        </div>
      </div>

      <!-- Additional Content -->
      <div class="cover-body animate-slide-in-up">
        <slot />
      </div>
    </div>

    <!-- Branding -->
    <div class="brand-logo">
      <div class="brand-logo-icon">SP</div>
      <div>
        <div>Smartslate Polaris</div>
        <div class="brand-powered-by">Powered by Solara</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cover-layout {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
}

.animated-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(167, 218, 219, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(79, 70, 229, 0.15) 0%, transparent 50%),
    linear-gradient(135deg, #020c1b 0%, #0d1b2a 50%, #142433 100%);
  animation: gradientShift 10s ease infinite;
  z-index: 0;
}

@keyframes gradientShift {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(2deg);
  }
}

.cover-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 900px;
}

.cover-header {
  margin-bottom: var(--space-6);
}

.cover-title {
  font-size: 4rem;
  font-weight: var(--font-bold);
  line-height: 1.1;
  margin-bottom: var(--space-3);
  background: linear-gradient(
    135deg,
    var(--primary-accent) 0%,
    var(--primary-accent-light) 50%,
    white 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cover-subtitle {
  font-size: var(--text-title);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  margin-bottom: 0;
}

.cover-metadata {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  animation-delay: 0.2s;
}

.metadata-card {
  padding: var(--space-3);
  text-align: center;
}

.metadata-label {
  font-size: var(--text-small);
  color: var(--text-disabled);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.metadata-value {
  font-size: var(--text-body);
  color: var(--primary-accent);
  font-weight: var(--font-semibold);
}

.cover-body {
  font-size: var(--text-heading);
  color: var(--text-secondary);
  animation-delay: 0.4s;
}
</style>
