export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyg8SOTyfvp7jUnIPp1VFE3yNuIs-kR1lffDhXIskghKBh9JAky1t6j-Lnu1IkSIOnGrg/exec';

// Token del endpoint antiguo (deprecado). Si la variable NEXT_PUBLIC_APPS_SCRIPT_URL
// en Vercel todavía apunta a este endpoint viejo, se ignora y se usa siempre el oficial.
const LEGACY_DEPRECATED_TOKEN = 'AKfycbxC6VFpj8pijG8DoNd6F';

/**
 * Resuelve el endpoint de Google Apps Script a utilizar:
 * - Usa la variable de entorno si es válida y no es la URL antigua deprecada.
 * - En caso contrario, usa el endpoint oficial actual.
 */
export function resolveAppsScriptUrl(envUrl?: string | null): string {
  if (
    envUrl &&
    envUrl.startsWith('https://script.google.com/') &&
    !envUrl.includes(LEGACY_DEPRECATED_TOKEN)
  ) {
    return envUrl;
  }
  return DEFAULT_APPS_SCRIPT_URL;
}

export const APPS_SCRIPT_ENDPOINT = resolveAppsScriptUrl(
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
);
