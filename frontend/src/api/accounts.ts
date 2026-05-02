/**
 * File: react/project/src/api/accounts.ts
 * Author: Frank Seely (fseely@bu.edu), 4/28/2026
 * Description: Manages the endpoints related to account model
 */


import { apiRequest } from "./client";
import { Account, AccountCreateInput, AccountUpdateInput } from "./types";

/** gets all accounts for the current user */
export function getAccounts() {
  return apiRequest<Account[]>("accounts");
}

/** gets one account by id */
export function getAccount(id: number) {
  return apiRequest<Account>(`account/${id}`);
}

/** creates a new account */
export function createAccount(payload: AccountCreateInput) {
  return apiRequest<Account>("accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** updates one account by id */
export function updateAccount(id: number, payload: AccountUpdateInput) {
  return apiRequest<Account>(`account/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** deletes one account by id */
export function deleteAccount(id: number) {
  return apiRequest<null>(`account/${id}`, {
    method: "DELETE",
  });
}
