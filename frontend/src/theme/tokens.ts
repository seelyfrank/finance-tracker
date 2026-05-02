/**
 * File: react/project/src/theme/tokens.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Design tokens for color, typography, spacing, and radius used by frontend UI.
 */


export const colors = {
  // Core palette
  background: '#031926',
  surface: '#0b2632',
  surfaceSoft: '#123746',
  accent: '#468189',
  primary: '#adcac7',
  primaryMuted: '#77aca2',
  cream: '#f4e9cd',

  // Text hierarchy
  textPrimary: '#f4e9cd',
  textSecondary: '#c8dbd7',
  textLabel: '#dbe8e5',
  textHelper: '#a8c4c0',
  textError: '#ffd8ce',
  textOnPrimary: '#031926',

  // Inputs and surfaces
  inputBackground: '#123746',
  inputBorder: 'rgba(157,190,187,0.20)',
  border: 'rgba(157,190,187,0.14)',

  // States
  primaryDisabled: 'rgba(157,190,187,0.45)',
  positive: '#2d8a57',
  /** Net category inflow line + bar — lighter solid green (readable on dark surfaces). */
  inflow: '#8ddfb8',
} as const;

export const spacing = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
} as const;

export const typography = {
  titleSize: 28,
  bodySize: 16,
  captionSize: 12,
  titleWeight: '700' as const,
  labelWeight: '600' as const,
  buttonWeight: '600' as const,
} as const;
