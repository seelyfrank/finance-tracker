/**
 * File: react/project/src/api/transactions.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: API client functions for CRUD operations on transaction resources.
 */


import { apiRequest } from "./client";
import {
  PaginatedTransactionListResponse,
  Transaction,
  TransactionCreateInput,
  TransactionListQuery,
  TransactionUpdateInput,
} from "./types";

/** builds a query string and skips empty values */
function buildQueryString(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

/** gets paginated transactions with optional filters */
export function getTransactions(params: TransactionListQuery = {}) {
  const query = buildQueryString({
    page: params.page,
    page_size: params.page_size,
    category: params.category,
    account: params.account,
    transaction_type: params.transaction_type,
    date_from: params.date_from,
    date_to: params.date_to,
  });
  return apiRequest<PaginatedTransactionListResponse<Transaction>>(`transactions${query}`);
}

/** gets one transaction by id */
export function getTransaction(id: number) {
  return apiRequest<Transaction>(`transaction/${id}`);
}

/** creates a transaction */
export function createTransaction(payload: TransactionCreateInput) {
  return apiRequest<Transaction>("transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** updates one transaction by id */
export function updateTransaction(id: number, payload: TransactionUpdateInput) {
  return apiRequest<Transaction>(`transaction/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** deletes one transaction by id */
export function deleteTransaction(id: number) {
  return apiRequest<null>(`transaction/${id}`, {
    method: "DELETE",
  });
}
