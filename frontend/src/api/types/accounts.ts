/**
 * File: react/project/src/api/types/accounts.ts
 * Author: Frank Seely (fseely@bu.edu), 4/28/2026
 * Description: TypeScript types describing account API request/response payload shapes.
 */


export type Account = {
  id: number;
  user: number;
  name: string;
  kind: string;
};

export type AccountCreateInput = {
  name: string;
  kind: string;
};

export type AccountUpdateInput = Partial<AccountCreateInput>;
