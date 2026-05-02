/**
 * File: react/project/src/api/categories.ts
 * Author: Frank Seely (fseely@bu.edu), 4/28/2026
 * Description: Manages the endpoints related to category model
 */


import { apiRequest } from "./client";
import { Category, CategoryCreateInput, CategoryUpdateInput } from "./types";

/** gets all categories for the current user */
export function getCategories() {
  return apiRequest<Category[]>("categories");
}

/** gets one category by id */
export function getCategory(id: number) {
  return apiRequest<Category>(`category/${id}`);
}

/** creates a new category */
export function createCategory(payload: CategoryCreateInput) {
  return apiRequest<Category>("categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** updates one category by id */
export function updateCategory(id: number, payload: CategoryUpdateInput) {
  return apiRequest<Category>(`category/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** deletes one category by id */
export function deleteCategory(id: number) {
  return apiRequest<null>(`category/${id}`, {
    method: "DELETE",
  });
}
