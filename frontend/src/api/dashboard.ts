/**
 * File: react/project/src/api/dashboard.ts
 * Author: Frank Seely (fseely@bu.edu), 4/28/2026
 * Description: Manages the endpoints related to dashboard page (the one main endpoint)
 */


import { apiRequest } from './client';
import { DashboardResponse } from './types';

/** gets dashboard analytics payload */
export function getDashboardResponse() {
    return apiRequest<DashboardResponse>('dashboard/')
}