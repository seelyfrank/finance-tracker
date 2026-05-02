/**
 * File: react/project/src/api/types/dashboard.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: TypeScript types for dashboard analytics payloads returned by the backend.
 */


export type BreakdownRow = {
  account_id?: number;
  account_name?: string;
  category_id?: number;
  category_name?: string;
  amount?: string;
  net_spent?: string;
  percent_of_total?: string;
};

export type SummaryData = {
  total_spent: string;
  completed_transactions_net: string;
  scheduled_transactions_net: string;
  allocated_spending_remaining: string;
  left_to_spend_today: string;
  daily_target_base: string;
  live_left_today: string;
  projected_for_period: string;
  projected_savings_amount: string;
  period_income: string;
  show_warning: boolean;
  needs_spent: string;
  wants_spent: string;
  actual_savings_amount: string;
  actual_savings_percent_of_income: string;
  needs_percent_of_income: string;
  wants_percent_of_income: string;
  needs_goal_amount: string;
  wants_goal_amount: string;
  savings_goal_amount: string;
  needs_goal_percent_of_income: string;
  wants_goal_percent_of_income: string;
  savings_goal_percent_of_income: string;
  agg_by_account: BreakdownRow[];
  agg_by_category: BreakdownRow[];
};

export type DashboardResponse = {
  month_data: SummaryData;
  future_payments: {
    id: number;
    date: string;
    category_name: string;
    net_effect: string;
  }[];
};
