/**
 * =============================================================================
 * Local Auth Storage
 * -----------------------------------------------------------------------------
 * 계정·세션을 LocalStorage에 저장한다.
 * 작품/원고 데이터와 분리된 키를 쓴다.
 * =============================================================================
 */

import type { AuthSession, AuthUser } from "@/auth/types";
import {
  AUTH_SESSION_KEY,
  AUTH_USERS_KEY,
} from "@/lib/storage/keys";
import {
  canUseStorage,
  nowIso,
  readJsonArray,
  readStorageString,
  writeJsonArray,
  writeStorageString,
} from "@/lib/storage/browser";
import { getStorageService } from "@/services/storage";

/** LocalStorage에 두는 계정 레코드 (비밀번호 원문은 저장하지 않음) */
export interface LocalAuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createUserId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function readAuthUsers(): LocalAuthUserRecord[] {
  return readJsonArray<LocalAuthUserRecord>(AUTH_USERS_KEY);
}

function writeAuthUsers(users: LocalAuthUserRecord[]): void {
  writeJsonArray(AUTH_USERS_KEY, users);
}

export function findAuthUserByEmail(
  email: string,
): LocalAuthUserRecord | undefined {
  const normalized = normalizeEmail(email);
  return readAuthUsers().find((user) => user.email === normalized);
}

export function createAuthUser(input: {
  email: string;
  passwordHash: string;
}): LocalAuthUserRecord {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error("이메일을 입력해 주세요.");
  }
  if (findAuthUserByEmail(email)) {
    throw new Error("이미 가입된 이메일입니다.");
  }

  const record: LocalAuthUserRecord = {
    id: createUserId(),
    email,
    passwordHash: input.passwordHash,
    createdAt: nowIso(),
  };

  writeAuthUsers([...readAuthUsers(), record]);
  return record;
}

function toAuthUser(record: LocalAuthUserRecord): AuthUser {
  return {
    id: record.id,
    email: record.email,
  };
}

export function writeAuthSession(user: AuthUser): AuthSession {
  const session: AuthSession = {
    user,
    expiresAt: null,
    accessToken: null,
  };
  writeStorageString(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function readAuthSession(): AuthSession | null {
  if (!canUseStorage()) return null;

  const raw = readStorageString(AUTH_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const session = parsed as AuthSession;
    if (!session.user?.id || !session.user.email) return null;
    return session;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (!canUseStorage()) return;
  getStorageService().removeItem(AUTH_SESSION_KEY);
}

export { normalizeEmail, toAuthUser };
