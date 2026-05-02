/**
 * File: react/project/src/theme/commonStyles.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Reusable RN style primitives shared across multiple screens/components.
 */


import { Platform, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from './tokens';

const cardShell = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  padding: spacing.xl,
  gap: spacing.lg,
  borderWidth: 0.6,
  borderColor: colors.border,
};

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    // Full-width on native; keep side gutters on web layouts.
    paddingHorizontal: Platform.OS === 'web' ? spacing.xxl : 10,
  },
  card: cardShell,
  title: {
    color: colors.textPrimary,
    fontSize: typography.titleSize,
    fontWeight: typography.titleWeight,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textLabel,
    fontWeight: typography.labelWeight,
  },
  helperText: {
    color: colors.textHelper,
    fontSize: typography.captionSize,
  },
  errorText: {
    color: colors.textError,
    fontSize: typography.captionSize,
  },
  input: {
    borderWidth: 0.6,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textHelper,
    backgroundColor: colors.inputBackground,
  },
  selectTrigger: {
    borderWidth: 0.6,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    /** TextInput (e.g. web date) must set color; otherwise browsers default to black. */
    color: colors.textPrimary,
  },
  selectTriggerText: {
    color: colors.textPrimary,
  },
  multilineInput: {
    borderWidth: 0.6,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textHelper,
    backgroundColor: colors.inputBackground,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: spacing.md - 2,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(157,190,187,0.2)',
  },
  buttonDisabled: {
    backgroundColor: colors.primaryDisabled,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontWeight: typography.buttonWeight,
    fontSize: typography.bodySize,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: typography.buttonWeight,
    fontSize: typography.bodySize,
  },

  /** Shared tab screens: scroll body */
  scrollScreenContent: {
    paddingTop: spacing.xl,
    paddingBottom: 0,
    gap: spacing.lg,
  },
  /** Full-width centered card (add surfaceCard700 / surfaceCard900 for max width). */
  surfaceCard: {
    ...cardShell,
    width: '100%',
    alignSelf: 'center',
  },
  surfaceCard700: { maxWidth: 700 },
  surfaceCard900: { maxWidth: 900 },
  /** Tighter vertical rhythm for dense forms (e.g. Transactions). */
  surfaceCardForm: {
    gap: spacing.md,
  },

  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pillRowWrap: {
    flexWrap: 'wrap',
  },
  pillRowBottomMargin: {
    marginBottom: spacing.sm,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSoft,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.textOnPrimary,
  },

  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  listRowCompact: {
    paddingVertical: spacing.xs,
  },
  listRowIndent: {
    paddingLeft: spacing.lg,
  },
  listRowMain: {
    flex: 1,
    gap: spacing.xs,
  },
  listRowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },

  formField: {
    gap: spacing.xs,
  },

  sectionHeading: {
    color: colors.textLabel,
    fontWeight: typography.labelWeight,
    marginTop: spacing.sm,
  },

  valueStrong: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  valueEmphasis: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  metaLabel: {
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  secondaryButtonCompact: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(157,190,187,0.2)',
    paddingHorizontal: spacing.md,
  },
  secondaryButtonCompactDense: {
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    backgroundColor: 'rgba(157,190,187,0.2)',
    paddingHorizontal: spacing.md,
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },

  buttonFlex: {
    marginTop: spacing.md - 2,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
    flex: 1,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  borderedSurface: {
    borderWidth: 0.6,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  borderedSurfacePadded: {
    borderWidth: 0.6,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.xs,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },

  inlineMenuItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  inlineMenuItemActive: {
    backgroundColor: colors.surfaceSoft,
  },
  inlineMenuItemText: {
    color: colors.textPrimary,
  },

  positiveCaption: {
    color: colors.positive,
    fontSize: typography.captionSize,
  },
  toastSuccess: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
    borderRadius: radius.md,
    borderWidth: 0.6,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  toastSuccessText: {
    color: colors.positive,
    fontSize: typography.bodySize,
    fontWeight: '600',
    textAlign: 'center',
  },
  toastError: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
    borderRadius: radius.md,
    borderWidth: 0.6,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  toastErrorText: {
    color: colors.textError,
    fontSize: typography.bodySize,
    fontWeight: '600',
    textAlign: 'center',
  },
  inflowEmphasis: {
    color: colors.inflow,
    fontWeight: '600',
  },
  warningCaption: {
    color: colors.textError,
    fontSize: typography.captionSize,
    marginTop: spacing.xs,
  },

  deltaPositive: {
    color: colors.positive,
  },
  deltaNegative: {
    color: colors.textError,
  },
  deltaNeutral: {
    color: colors.textSecondary,
  },

  /** Transaction log pagination */
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  paginationButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: colors.textHelper,
  },
  paginationInfo: {
    color: colors.textHelper,
    fontSize: typography.captionSize,
    flex: 1,
    textAlign: 'center',
  },

  /** Transactions: large amount field */
  formAmountBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  formAmountInput: {
    borderWidth: 0.6,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: '100%',
    fontSize: 42,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
  },
  logFiltersRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  logFilterField: {
    flex: 1,
    minWidth: 120,
    gap: spacing.xs,
  },
  logFilterDateInput: {
    borderWidth: 0.6,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textHelper,
    backgroundColor: colors.inputBackground,
  },
  filterTotalsSection: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  filterTotalsTitle: {
    color: colors.textSecondary,
    fontSize: typography.captionSize,
    fontWeight: '600',
  },
  filterNetValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
});
