/**
 * File: react/project/src/api/client.ts
 * Author: Frank Seely (fseely@bu.edu), 4/28/2026
 * Description: The base wrapper for all other API endpoints that handles building URL, attaching token, etc.
 */


import { tokenStorage } from "./tokenStorage";

const LOCAL_API_BASE_URL = "http://127.0.0.1:8000/financial_tracker/api";
const DEPLOYED_API_BASE_URL =
  "https://finance-tracker-production-a01a.up.railway.app/financial_tracker/api";

declare const process:
  | { env?: Record<string | number | symbol, string | undefined> }
  | undefined;

function normalizeBaseUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

function configuredApiBaseUrl(): string | null {
  const expo = normalizeBaseUrl(process?.env?.EXPO_PUBLIC_API_BASE_URL);
  if (expo) return expo;

  const next = normalizeBaseUrl(process?.env?.NEXT_PUBLIC_API_BASE_URL);
  if (next) return next;

  return null;
}

function fallbackBaseUrl(): string {
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;
  return isDev ? LOCAL_API_BASE_URL : DEPLOYED_API_BASE_URL;
}

function getBaseUrl(): string {
  return configuredApiBaseUrl() ?? fallbackBaseUrl();
}

export type ApiError = {
    status: number;
    data: unknown;
    message: string;
  };

/** builds a full api url from a relative endpoint */
function buildUrl(endpoint: string) {
    const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${getBaseUrl()}/${clean}`;
}

/** tries to parse json and falls back to plain text */
async function parseBody(response: Response) {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text)
    } catch {
        return text;
    }
}

/** runs a request with auth header and basic error handling */
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await tokenStorage.getAccessToken()

    const isFormData = options.body instanceof FormData;

    const headers: HeadersInit = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json'} ),
        ...(token ? { Authorization: `Token ${token}` } : {} ),
        ...(options.headers ?? {}),
    };

    const response = await fetch(buildUrl(endpoint), {
        ...options,
        headers,
    });

    const data = await parseBody(response);

    if (!response.ok) {
        const error: ApiError = {
            status: response.status,
            data,
            message: `Request failed with status ${response.status}`,
        };
        throw error
    }

    return data as T;
}