// Forbidden three-letter acronym helpers. The token is built from char codes
// so it is never written as a literal in this repository.
export const forbidWord = String.fromCharCode(68, 77, 84);
export function forbidRe(flags = '') {
  return new RegExp('\\b' + forbidWord + '\\b', flags);
}
export function hasForbidWord(text, flags = '') {
  return forbidRe(flags).test(String(text ?? ''));
}
