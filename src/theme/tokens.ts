export const colors = {
  // Brand
  primary: '#7C3AED',
  primaryLight: '#EDE9FE',
  primaryDark: '#5B21B6',

  // Backgrounds — light theme matching Figma
  bg: '#F5F5F5',
  bgCard: '#FFFFFF',
  bgInput: '#F0F0F0',
  bgOverlay: 'rgba(0,0,0,0.5)',

  // Text
  textPrimary: '#111111',
  textSecondary: '#555555',
  textMuted: '#999999',

  // Accents
  like: '#EF4444',
  likeActive: '#FCA5A5',
  verified: '#7C3AED',
  paid: '#F59E0B',
  free: '#10B981',

  // Borders
  border: '#E5E5E5',
  borderLight: '#EEEEEE',

  // Status
  error: '#EF4444',
  success: '#10B981',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
};
