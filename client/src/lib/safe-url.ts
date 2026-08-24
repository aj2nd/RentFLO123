const MAX_URL_LENGTH = 2048;
const SAFE_IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i;

function isCleanString(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.length <= MAX_URL_LENGTH
    && !/[\u0000-\u001F\u007F\\]/.test(value);
}

export function safeInternalPath(value: unknown): string | null {
  if (!isCleanString(value) || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function safeHttpsUrl(value: unknown, allowedHostSuffix?: string): string | null {
  if (!isCleanString(value)) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const allowed = !allowedHostSuffix
      || hostname === allowedHostSuffix
      || hostname.endsWith(`.${allowedHostSuffix}`);
    if (url.protocol !== "https:" || url.username || url.password || !allowed) return null;
    return url.href;
  } catch {
    return null;
  }
}

export const safeExternalHttpsUrl = (value: unknown) => safeHttpsUrl(value);

export function safeImageSource(value: unknown): string | null {
  if (!isCleanString(value)) return null;
  if (SAFE_IMAGE_DATA_URL.test(value)) return value;
  return safeHttpsUrl(value);
}
