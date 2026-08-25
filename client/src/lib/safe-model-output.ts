/**
 * Model responses remain untrusted even after server validation. Remove control
 * characters here as defense in depth; callers must render this return value as
 * a React text child, never via HTML injection or executable URLs.
 */
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/g;

export function safeModelTextForDisplay(value: unknown, maximumLength = 12_000): string {
  return typeof value === "string"
    ? value.replace(CONTROL_CHARACTERS, "").slice(0, maximumLength)
    : "";
}
