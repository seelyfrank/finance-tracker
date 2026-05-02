/**
 * File: react/project/src/api/types/transactions.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: TypeScript types for transaction entities, filters, and mutation payloads.
 */


import type { TransactionType } from "./common";

export type Transaction = {
  id: number;
  user: number;
  account: number;
  category: number;
  transaction_type: TransactionType;
  amount: string;
  date: string;
  comment: string;
  created_at: string;
};

export type TransactionCreateInput = {
  account: number;
  category: number;
  transaction_type: TransactionType;
  amount: string;
  date: string;
  comment?: string;
};

export type TransactionUpdateInput = Partial<TransactionCreateInput>;

export type TransactionListQuery = {
  page?: number;
  page_size?: number;
  category?: number;
  account?: number;
  transaction_type?: TransactionType;
  date_from?: string;
  date_to?: string;
};

export type PaginatedTransactionListResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  /** Totals over the full filtered result set (all pages), not just the current page. */
  filter_total_sent: string;
  filter_total_received: string;
  /** Received minus sent (same sign convention as the log: received positive, sent negative). */
  filter_net: string;
};

/** Generic paginated response (other list endpoints may omit filter_*). */
export type PaginatedListResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
