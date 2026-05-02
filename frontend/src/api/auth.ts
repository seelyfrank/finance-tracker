/**
 * File: react/project/src/api/auth.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Authentication API helpers for login/register requests and token handling integration.
 */


import { apiRequest } from './client';
import { tokenStorage } from './tokenStorage';

type AuthResponse = {
  token: string;
  user_id: number;
  username: string;
};

/** logs in and stores the token */
export async function login(username: string, password: string) {
  const data = await apiRequest<AuthResponse>(
    'login/',
    { method: 'POST', body: JSON.stringify({ username, password }) }
  );
  await tokenStorage.setToken(data.token);
  return data;
}

/** registers and stores the token */
export async function register(payload: {
  username: string;
  password: string;
  fixed_income: string;
  savings_goal: string;
  email?: string;
}) {
  const data = await apiRequest<AuthResponse>('register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  await tokenStorage.setToken(data.token);
  return data;
}

/** clears auth token from storage */
export async function logout() {
  await tokenStorage.clearToken();
}