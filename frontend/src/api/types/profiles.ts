/**
 * File: react/project/src/api/types/profiles.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: TypeScript types for profile resources and update payload contracts.
 */


export type Profile = {
  id: number;
  user: number;
  fixed_income: string;
  savings_goal: string;
  default_account: number | null;
};

export type ProfileCreateInput = {
  fixed_income: string;
  savings_goal: string;
  default_account?: number | null;
};

export type ProfileUpdateInput = Partial<ProfileCreateInput>;
