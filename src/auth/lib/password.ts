/**
 * =============================================================================
 * 로컬 비밀번호 해시
 * -----------------------------------------------------------------------------
 * 브라우저 Web Crypto로 SHA-256 해시를 만든다.
 * 서버/Supabase Auth로 옮기기 전 LocalStorage 전용.
 * =============================================================================
 */

/** 이메일+비밀번호를 합쳐 해시 (같은 비번이라도 계정마다 다르게) */
export async function hashPassword(
  email: string,
  password: string,
): Promise<string> {
  const normalized = `${email.trim().toLowerCase()}:${password}`;
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(
  email: string,
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const next = await hashPassword(email, password);
  return next === passwordHash;
}
