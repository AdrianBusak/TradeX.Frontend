import { HttpContextToken } from '@angular/common/http';

export const FORBIDDEN_FALLBACK_ROUTE = new HttpContextToken<string[] | null>(() => null);
export const SUPPRESS_GLOBAL_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
export const SUPPRESS_FORBIDDEN_REDIRECT = new HttpContextToken<boolean>(() => false);
