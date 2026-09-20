// src/theme/colors.ts
// Style inspiré de Calm : dégradé doux, pilules semi-transparentes, un seul CTA plein qui ressort.

export const gradients = {
  hero: ['#0f1c3f', '#1a2f5c', '#2d4a8a'] as const, // bleu nuit -> bleu héroïque profond
};

export const colors = {
  background: '#0f1c3f',
  backgroundEnd: '#2d4a8a',

  pill: 'rgba(255, 255, 255, 0.08)',
  pillBorder: 'rgba(255, 255, 255, 0.14)',
  pillActive: 'rgba(250, 204, 21, 0.16)',
  pillActiveBorder: '#facc15',

  gold: '#facc15',
  success: '#4ade80',
  danger: '#f87171',

  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textMuted: 'rgba(255, 255, 255, 0.45)',

  ctaBackground: '#ffffff',
  ctaText: '#0f1c3f',
};

export const radius = {
  sm: 10,
  md: 16,
  pill: 28,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
};

export const type = {
  display: { fontSize: 24, fontWeight: '600' as const, letterSpacing: -0.3 },
  h1: { fontSize: 19, fontWeight: '600' as const },
  h2: { fontSize: 15, fontWeight: '600' as const },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyStrong: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  mono: { fontSize: 17, fontWeight: '700' as const },
};