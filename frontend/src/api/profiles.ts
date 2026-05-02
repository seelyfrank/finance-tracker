/**
 * File: react/project/src/api/profiles.ts
 * Author: Frank Seely (fseely@bu.edu), 4/28/2026
 * Description: Manages endpoints for all profile related endpoints
 */


import { apiRequest } from "./client";
import { Profile, ProfileCreateInput, ProfileUpdateInput } from "./types";

/** gets all profiles for the current user */
export function getProfiles() {
  return apiRequest<Profile[]>("profiles");
}

/** gets one profile by id */
export function getProfile(id: number) {
  return apiRequest<Profile>(`profile/${id}`);
}

/** creates a profile */
export function createProfile(payload: ProfileCreateInput) {
  return apiRequest<Profile>("profiles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** updates one profile by id */
export function updateProfile(id: number, payload: ProfileUpdateInput) {
  return apiRequest<Profile>(`profile/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** deletes one profile by id */
export function deleteProfile(id: number) {
  return apiRequest<null>(`profile/${id}`, {
    method: "DELETE",
  });
}
