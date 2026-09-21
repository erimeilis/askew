import en from './en.json';
type Dict = Record<string, string>;
const locales: Record<string, Dict> = { en };
let current = 'en';
export function registerLocale(code: string, dict: Dict): void { locales[code] = { ...locales[code], ...dict }; }
export function setLocale(code: string): void { if (locales[code]) current = code; }
export function getLocale(): string { return current; }
export function availableLocales(): string[] { return Object.keys(locales); }
export function t(key: string, params: Record<string, string | number> = {}): string {
  const raw = locales[current]?.[key] ?? locales.en[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}
