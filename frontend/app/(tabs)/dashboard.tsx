/**
 * File: react/project/app/(tabs)/dashboard.tsx
 * Author: Frank Seely (fseely@bu.edu), 4/28/2026
 * Description: Dashboard screen UI showing budget metrics, charts, and account/category rollups.
 */


import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getCategories, getDashboardResponse } from '@/src/api';
import type { BreakdownRow, Category, DashboardResponse, SummaryData } from '@/src/api/types';
import { formatMoney } from '@/src/formatMoney';
import { commonStyles, colors, spacing } from '@/src/theme';

/** renders the dashboard screen and loads summary data */
export default function DashboardScreen() {
  

  // state management
  const [compareMode, setCompareMode] = useState<'percent' | 'amount'>('percent');
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoriesForTargets, setCategoriesForTargets] = useState<Category[]>([]);

  const selectedSummary: SummaryData | null = useMemo(() => {
    if (!data) return null;
    return data.month_data;
  }, [data]);

  const daysInCalendarMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }, []);

  const allocatedRemainingIsNegative = useMemo(() => {
    if (!selectedSummary) return false;
    const allocated = Number(selectedSummary.allocated_spending_remaining);
    return Number.isFinite(allocated) && allocated < 0;
  }, [selectedSummary]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [response, catsRes] = await Promise.all([
        getDashboardResponse(),
        getCategories(),
      ]);
      setData(response);
      setCategoriesForTargets(catsRes);
    } catch {
      setError('Could not load dashboard data. Sign in and try again.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, []),
  );

  return (
    <SafeAreaView style={commonStyles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={commonStyles.scrollScreenContent}>
        <View style={[commonStyles.surfaceCard, commonStyles.surfaceCard700]}>
          <Text style={commonStyles.title}>Budget Dashboard</Text>
          <Text style={commonStyles.subtitle}>
            See what you&apos;re spending this month. Only includes transactions from the first of the month to the
            last day in the month (for scheduled transactions).
          </Text>
          {loading ? <Text style={commonStyles.helperText}>Loading dashboard data...</Text> : null}

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}
        </View>

        {data && selectedSummary ? (
          <View style={[commonStyles.surfaceCard, commonStyles.surfaceCard700]}>
            <Text style={commonStyles.sectionHeading}>Summary</Text>
            <View style={styles.focusSummary}>
              <Text style={styles.focusLabel}>Daily spending remaining</Text>
              <Text style={styles.focusValue}>
                {formatMoney(selectedSummary.live_left_today)}
              </Text>
              {allocatedRemainingIsNegative ? (
                // Warning message when the user is spending poorly
                <Text style={styles.overspendHint}>
                  Spend as little as possible — allocated remaining for this month is already negative.
                </Text>
              ) : null}
              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMetricCol}>
                  <Text style={styles.summaryMetricLabel}>Todays spending target</Text>
                  <Text style={styles.summaryMetricValue}>
                    {formatMoney(selectedSummary.daily_target_base)}
                  </Text>
                </View>
                <View style={styles.summaryMetricDivider} />
                <View style={styles.summaryMetricCol}>
                  <Text style={styles.summaryMetricLabel}>Monthly remaining budget</Text>
                  <Text style={styles.summaryMetricValue}>
                    {formatMoney(selectedSummary.allocated_spending_remaining)}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMetricCol}>
                  <Text style={styles.summaryMetricLabel}>Projected spending</Text>
                  <Text style={styles.summaryMetricValue}>
                    {formatMoney(selectedSummary.projected_for_period)}
                  </Text>
                </View>
                <View style={styles.summaryMetricDivider} />
                <View style={styles.summaryMetricCol}>
                  <Text style={styles.summaryMetricLabel}>Projected savings</Text>
                  <Text style={styles.summaryMetricValue}>
                    {formatMoney(selectedSummary.projected_savings_amount)}
                  </Text>
                </View>
              </View>
            </View>
            <StatRow label="Total spent" value={formatMoney(selectedSummary.total_spent)} />
            <StatRow
              label="Completed transactions"
              value={formatMoney(selectedSummary.completed_transactions_net)}
              indented
            />
            <StatRow
              label="Scheduled transactions"
              value={formatMoney(selectedSummary.scheduled_transactions_net)}
              indented
            />
            {selectedSummary.show_warning ? (
              // More warning messages based soley on the projections
              <Text style={commonStyles.warningCaption}>
                {
                  "Warning: After this month's projected spending, what's left of your income is below your monthly savings goal."
                }
              </Text>
            ) : (
              <Text style={commonStyles.helperText}>
                {
                  "After this month's projected spending, your income still covers your monthly savings goal."
                }
              </Text>
            )}

            <Text style={commonStyles.sectionHeading}>Goal Alignment (Actual vs Goal)</Text>
            <View style={[commonStyles.pillRow, commonStyles.pillRowWrap]}>
              <Pressable
                onPress={() => setCompareMode('percent')}
                style={[
                  commonStyles.pill,
                  compareMode === 'percent' ? commonStyles.pillActive : null,
                ]}
              >
                <Text
                  style={[
                    commonStyles.pillText,
                    compareMode === 'percent' ? commonStyles.pillTextActive : null,
                  ]}
                >
                  %
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setCompareMode('amount')}
                style={[
                  commonStyles.pill,
                  compareMode === 'amount' ? commonStyles.pillActive : null,
                ]}
              >
                <Text
                  style={[
                    commonStyles.pillText,
                    compareMode === 'amount' ? commonStyles.pillTextActive : null,
                  ]}
                >
                  $
                </Text>
              </Pressable>
            </View>
            <GoalVarianceChips summary={selectedSummary} mode={compareMode} />
            <GoalComparisonRows summary={selectedSummary} mode={compareMode} />

            <Text style={commonStyles.sectionHeading}>By Account (Net)</Text>
            <Text style={commonStyles.helperText}>Net = sent - received for this month.</Text>
            {selectedSummary.agg_by_account.length ? (
              selectedSummary.agg_by_account.slice(0, 5).map((row, idx) => (
                <BreakdownRowView key={`acct-${idx}`} row={row} />
              ))
            ) : (
              <Text style={commonStyles.helperText}>No account data for this range.</Text>
            )}

            <Text style={commonStyles.sectionHeading}>By category (top 10)</Text>
            <Text style={commonStyles.helperText}>
              {
                "Bars compare net spend this period to that category's spend goal (prorated from the monthly goal). Orange is over goal."
              }
            </Text>
            {selectedSummary.agg_by_category.length ? (
              sortCategoriesForDashboard(selectedSummary.agg_by_category).slice(0, 10).map((row, idx) => (
                <CategoryBreakdownRow
                  key={`cat-${row.category_id ?? idx}`}
                  row={row}
                  categories={categoriesForTargets}
                  monthlyIncome={Number(selectedSummary.period_income)}
                  daysInMonth={daysInCalendarMonth}
                  timerangeDays={daysInCalendarMonth}
                />
              ))
            ) : (
              <Text style={commonStyles.helperText}>No category data for this range.</Text>
            )}

          </View>
        ) : null}

        {data?.future_payments?.length ? (
          <View style={[commonStyles.surfaceCard, commonStyles.surfaceCard700]}>
            <Text style={commonStyles.sectionHeading}>Upcoming Payments</Text>
            {data.future_payments.slice(0, 5).map((payment) => (
              <View key={payment.id} style={commonStyles.listRow}>
                <Text style={commonStyles.label}>
                  {payment.date} - {payment.category_name}
                </Text>
                <Text style={commonStyles.valueStrong}>{formatMoney(payment.net_effect)}</Text>
              </View>
            ))}
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

/** renders a single account/category breakdown row */
function BreakdownRowView({ row }: { row: BreakdownRow }) {
  const name = row.account_name ?? row.category_name ?? 'Unknown';
  const amount = row.amount ?? row.net_spent ?? '0';
  const numericAmount = Number(amount);
  const isNetInflow = Number.isFinite(numericAmount) && numericAmount < 0;
  const amountDisplay = isNetInflow
    ? `+${formatMoney(String(Math.abs(numericAmount)))}`
    : formatMoney(amount);
  const numericPct = Number(row.percent_of_total ?? '0');
  const pct = row.percent_of_total
    ? ` (${isNetInflow ? `+${Math.abs(numericPct).toFixed(1)}` : numericPct.toFixed(1)}%)`
    : '';

  return (
    <View style={commonStyles.listRow}>
      <Text style={commonStyles.label}>{name}</Text>
      <Text style={[commonStyles.valueStrong, isNetInflow ? commonStyles.inflowEmphasis : null]}>
        {amountDisplay}
        {pct}
      </Text>
    </View>
  );
}

/** sorts categories so special rows appear last */
function sortCategoriesForDashboard(rows: BreakdownRow[]): BreakdownRow[] {
  return [...rows].sort((a, b) => {
    const rank = (name: string) => {
      const normalized = name.trim().toLowerCase();
      if (normalized === 'other') return 1;
      if (normalized === 'income') return 2; // income below other
      return 0;
    };
    const byRank = rank(a.category_name || '') - rank(b.category_name || '');
    if (byRank !== 0) return byRank;
    return 0;
  });
}

/** renders one category row with spend-vs-goal visuals */
function CategoryBreakdownRow({
  row,
  categories,
  monthlyIncome,
  daysInMonth,
  timerangeDays,
}: {
  row: BreakdownRow;
  categories: Category[];
  monthlyIncome: number;
  daysInMonth: number;
  timerangeDays: number;
}) {
  const name = row.category_name ?? 'Unknown';
  const amountStr = row.amount ?? row.net_spent ?? '0';
  const netSpent = Number(amountStr);
  const isIncomeCategory = name.trim().toLowerCase() === 'income';
  // sent - received: positive = net spending, negative = net inflow (more received than sent)
  // useful if you want to just track a side hussle income or have any other 
  // category that can profit
  const isNetInflow = Number.isFinite(netSpent) && netSpent < 0;
  const spentForBar = Number.isFinite(netSpent) ? Math.max(0, netSpent) : 0;
  const cat =
    row.category_id != null ? categories.find((c) => c.id === row.category_id) : undefined;
  const monthlyGoal = cat && cat.spend_goal != null ? Number(cat.spend_goal) : NaN;
  const proratedGoal =
    Number.isFinite(monthlyGoal) && monthlyGoal >= 0 && daysInMonth > 0
      ? (monthlyGoal / daysInMonth) * timerangeDays
      : 0;
  const targetPctOfIncome =
    cat && monthlyIncome > 0 && Number.isFinite(monthlyGoal)
      ? (monthlyGoal / monthlyIncome) * 100
      : null;

  return (
    <View style={styles.categoryBarBlock}>
      <Text style={commonStyles.label}>{name}</Text>
      {targetPctOfIncome != null ? (
        <Text style={commonStyles.helperText}>Target {targetPctOfIncome.toFixed(1)}% of income</Text>
      ) : !cat ? (
        <Text style={commonStyles.helperText}>
          No matching category — goal bar uses $0 goal until the category exists.
        </Text>
      ) : monthlyIncome <= 0 ? (
        <Text style={commonStyles.helperText}>Add monthly income on your profile to see target %.</Text>
      ) : null}
      {isNetInflow ? (
        <Text style={commonStyles.helperText}>
          {isIncomeCategory
            ? 'Income made this period is shown as a positive inflow.'
            : 'The bar is for spending vs goal; net inflow is not spend toward the goal.'}
        </Text>
      ) : null}
      <CategorySpendGoalBar spent={spentForBar} proratedGoal={proratedGoal} inflow={isNetInflow} />
      <Text style={[commonStyles.helperText, isNetInflow ? commonStyles.inflowEmphasis : null]}>
        {formatCategoryNetVsGoalLine(netSpent, proratedGoal, isIncomeCategory)}
      </Text>
    </View>
  );
}

/** draws the category goal bar from spent and goal amounts */
function CategorySpendGoalBar({
  spent,
  proratedGoal,
  inflow = false,
}: {
  spent: number;
  proratedGoal: number;
  inflow?: boolean;
}) {
  if (inflow) {
    return <View style={[styles.goalBarTrack, styles.goalBarInflow]} />;
  }

  const maxScale = Math.max(spent, proratedGoal, 0.01);
  const within = Math.min(spent, proratedGoal);
  const over = Math.max(spent - proratedGoal, 0);
  const wWithin = (within / maxScale) * 100;
  const wOver = (over / maxScale) * 100;
  const wEmpty = Math.max(0, 100 - wWithin - wOver);
  const markerPct = proratedGoal > 0 ? (proratedGoal / maxScale) * 100 : 0;

  return (
    <View style={styles.goalBarTrack}>
      <View style={styles.goalBarFillRow}>
        {wWithin > 0 ? (
          <View style={[styles.goalBarWithin, { width: `${wWithin}%` }]} />
        ) : null}
        {wOver > 0 ? (
          <View style={[styles.goalBarOverflow, { width: `${wOver}%` }]} />
        ) : null}
        {wEmpty > 0.05 ? (
          <View style={[styles.goalBarRemainder, { width: `${wEmpty}%` }]} />
        ) : null}
      </View>
      {proratedGoal > 0 ? (
        <View style={[styles.goalBarMarker, { left: `${markerPct}%` }]} />
      ) : null}
    </View>
  );
}

/** renders a compact stat row label/value pair */
function StatRow({
  label,
  value,
  indented = false,
}: {
  label: string;
  value: string;
  indented?: boolean;
}) {
  return (
    <View
      style={[
        commonStyles.listRow,
        commonStyles.listRowCompact,
        indented ? commonStyles.listRowIndent : null,
      ]}
    >
      <Text style={[commonStyles.label, indented ? commonStyles.metaLabel : null]}>{label}</Text>
      <Text style={[commonStyles.valueStrong, indented ? commonStyles.metaValue : null]}>{value}</Text>
    </View>
  );
}

/** renders one tiny legend marker with text */
function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={commonStyles.helperText}>{label}</Text>
    </View>
  );
}

/** renders quick delta chips for needs wants and savings */
function GoalVarianceChips({
  summary,
  mode,
}: {
  summary: SummaryData;
  mode: 'percent' | 'amount';
}) {
  const rows = getGoalComparisonRows(summary, mode);

  return (
    <View style={styles.varianceChipRow}>
      {rows.map((row) => (
        <View key={row.key} style={styles.varianceChip}>
          <Text style={styles.varianceChipTitle}>{row.label}</Text>
          <Text
            style={[
              styles.varianceChipValue,
              getDeltaColorStyle(row.delta, row.higherIsBetter),
            ]}
          >
            {formatDelta(row.delta, mode)}
          </Text>
          <Text style={commonStyles.helperText}>vs goal</Text>
        </View>
      ))}
    </View>
  );
}

/** renders detailed goal comparison rows */
function GoalComparisonRows({
  summary,
  mode,
}: {
  summary: SummaryData;
  mode: 'percent' | 'amount';
}) {
  const rows = getGoalComparisonRows(summary, mode);

  return (
    <View style={styles.comparisonSection}>
      <View style={styles.legendRow}>
        <LegendItem label="Actual" color={colors.primary} />
        <LegendItem label="Goal" color={colors.textSecondary} />
      </View>
      {rows.map((row) => {
        const maxValue = Math.max(row.actual, row.goal, 0.01);
        const actualWidth = (row.actual / maxValue) * 100;
        const goalWidth = (row.goal / maxValue) * 100;

        return (
          <View key={row.key} style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <Text style={commonStyles.label}>{row.label}</Text>
              <Text style={[commonStyles.valueStrong, getDeltaColorStyle(row.delta, row.higherIsBetter)]}>
                {formatDelta(row.delta, mode)}
              </Text>
            </View>
            <View style={styles.comparisonBarGroup}>
              <Text style={styles.comparisonLineLabel}>Actual</Text>
              <View style={styles.comparisonTrack}>
                <View style={[styles.comparisonActualBar, { width: `${actualWidth}%` }]} />
              </View>
              <Text style={styles.comparisonValue}>{formatDisplayValue(row.actual, mode)}</Text>
            </View>
            <View style={styles.comparisonBarGroup}>
              <Text style={styles.comparisonLineLabel}>Goal</Text>
              <View style={styles.comparisonTrack}>
                <View style={[styles.comparisonGoalBar, { width: `${goalWidth}%` }]} />
              </View>
              <Text style={styles.comparisonValue}>{formatDisplayValue(row.goal, mode)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}


type GoalComparisonRow = {
  key: 'needs' | 'wants' | 'savings';
  label: 'Needs' | 'Wants' | 'Savings';
  actual: number;
  goal: number;
  delta: number;
  higherIsBetter: boolean;
};

/** maps summary data into comparable goal rows */
function getGoalComparisonRows(
  summary: SummaryData,
  mode: 'percent' | 'amount',
): GoalComparisonRow[] {
  const actualNeeds = mode === 'percent' ? toPercent(summary.needs_percent_of_income) : toMoney(summary.needs_spent);
  const goalNeeds = mode === 'percent' ? toPercent(summary.needs_goal_percent_of_income) : toMoney(summary.needs_goal_amount);
  const actualWants = mode === 'percent' ? toPercent(summary.wants_percent_of_income) : toMoney(summary.wants_spent);
  const goalWants = mode === 'percent' ? toPercent(summary.wants_goal_percent_of_income) : toMoney(summary.wants_goal_amount);
  const actualSavings = mode === 'percent'
    ? toPercent(summary.actual_savings_percent_of_income)
    : toMoney(summary.actual_savings_amount);
  const goalSavings = mode === 'percent' ? toPercent(summary.savings_goal_percent_of_income) : toMoney(summary.savings_goal_amount);

  return [
    {
      key: 'needs',
      label: 'Needs',
      actual: actualNeeds,
      goal: goalNeeds,
      delta: actualNeeds - goalNeeds,
      higherIsBetter: false,
    },
    {
      key: 'wants',
      label: 'Wants',
      actual: actualWants,
      goal: goalWants,
      delta: actualWants - goalWants,
      higherIsBetter: false,
    },
    {
      key: 'savings',
      label: 'Savings',
      actual: actualSavings,
      goal: goalSavings,
      delta: actualSavings - goalSavings,
      higherIsBetter: true,
    },
  ];
}

/** picks a color style based on delta direction */
function getDeltaColorStyle(delta: number, higherIsBetter: boolean) {
  if (Math.abs(delta) < 0.01) {
    return commonStyles.deltaNeutral;
  }

  const isPositiveOutcome = higherIsBetter ? delta > 0 : delta < 0;
  return isPositiveOutcome ? commonStyles.deltaPositive : commonStyles.deltaNegative;
}

/** sent − received: >0 = net out (spend), <0 = net inflow (profit) vs that category since sometimes
 * a person may want to track money they made (e.g., gambling) */
/** formats net category text against its period goal */
function formatCategoryNetVsGoalLine(net: number, proratedGoal: number, isIncomeCategory = false): string {
  if (!Number.isFinite(net)) {
    return `${formatMoney('0')} net · ${formatMoney(String(proratedGoal))} goal this period`;
  }
  if (net === 0) {
    return `${formatMoney('0')} net · ${formatMoney(String(proratedGoal))} goal this period`;
  }
  if (net > 0) {
    return `${formatMoney(String(net))} net out · ${formatMoney(String(proratedGoal))} goal this period`;
  }
  const inflow = Math.abs(net);
  if (isIncomeCategory) {
    return `+${formatMoney(String(inflow))} made this period`;
  }
  return `+${formatMoney(String(inflow))} net inflow · ${formatMoney(String(proratedGoal))} goal this period`;
}

// helpers
/** safely converts api value to money number */
function toMoney(value: string): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** safely converts api value to non-negative percent */
function toPercent(value: string): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/** formats bar values for display by mode */
function formatDisplayValue(value: number, mode: 'percent' | 'amount'): string {
  if (mode === 'percent') return `${value.toFixed(1)}%`;
  return formatMoney(String(value));
}

/** formats delta with sign and unit */
function formatDelta(delta: number, mode: 'percent' | 'amount'): string {
  const prefix = delta > 0 ? '+' : '';
  if (mode === 'percent') return `${prefix}${delta.toFixed(1)}%`;
  return `${prefix}${formatMoney(String(delta))}`;
}

const styles = StyleSheet.create({
  focusSummary: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  focusLabel: {
    ...commonStyles.label,
    fontSize: 18,
  },
  focusValue: {
    color: colors.textPrimary,
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
  },
  overspendHint: {
    ...commonStyles.helperText,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    marginTop: spacing.sm,
  },
  summaryMetricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  summaryMetricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  summaryMetricLabel: {
    ...commonStyles.label,
    fontSize: 16,
    textAlign: 'center',
  },
  summaryMetricValue: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryProjectedSavings: {
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  rowIndented: {
    paddingLeft: spacing.lg,
  },
  categoryBarBlock: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  goalBarTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
    position: 'relative',
    marginTop: spacing.xs,
  },
  goalBarInflow: {
    backgroundColor: colors.inflow,
  },
  goalBarFillRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  goalBarWithin: {
    height: 14,
    backgroundColor: colors.primaryMuted,
  },
  goalBarOverflow: {
    height: 14,
    backgroundColor: '#b84a32',
  },
  goalBarRemainder: {
    height: 14,
    backgroundColor: 'transparent',
  },
  goalBarMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: colors.cream,
    borderRadius: 1,
    zIndex: 4,
  },
  comparisonSection: {
    gap: spacing.sm,
  },
  varianceChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  varianceChip: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  varianceChipTitle: {
    ...commonStyles.label,
    color: colors.textSecondary,
  },
  varianceChipValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  comparisonCard: {
    borderWidth: 0.6,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonBarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  comparisonLineLabel: {
    width: 44,
    ...commonStyles.helperText,
    fontWeight: '600',
  },
  comparisonTrack: {
    flex: 1,
    height: 10,
    borderRadius: 0,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
  },
  comparisonActualBar: {
    height: '100%',
    borderRadius: 0,
    backgroundColor: colors.primary,
  },
  comparisonGoalBar: {
    height: '100%',
    borderRadius: 0,
    backgroundColor: colors.textSecondary,
  },
  comparisonValue: {
    minWidth: 70,
    textAlign: 'right',
    color: colors.textPrimary,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});
