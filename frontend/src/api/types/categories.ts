/**
 * File: react/project/src/api/types/categories.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: TypeScript types describing category API request/response payload shapes.
 */

export type Category = {
  id: number;
  user: number;
  name: string;
  need_or_want: 'need' | 'want';
  spend_goal: string;
};

export type CategoryCreateInput = {
  name: string;
  need_or_want: 'need' | 'want';
  spend_goal: string;
};

export type CategoryUpdateInput = Partial<CategoryCreateInput>;
