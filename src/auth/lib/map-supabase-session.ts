/**
 * =============================================================================
 * Supabase Session → AuthSession 매핑
 * =============================================================================
 */

import type { Session, User } from "@supabase/supabase-js";
import type { AuthSession, AuthUser } from "@/auth/types";

export function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      (typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : null) ?? null,
  };
}

export function mapSupabaseSession(session: Session | null): AuthSession | null {
  if (!session?.user) return null;

  return {
    user: mapSupabaseUser(session.user),
    expiresAt: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
    accessToken: session.access_token ?? null,
  };
}
