/**
 * =============================================================================
 * characters 테이블 리포지토리
 * =============================================================================
 */

import type { Character } from "@/features/characters/types/character";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { characterToRow, rowToCharacter } from "@/database/supabase/mappers";
import { toCloudError } from "@/database/supabase/to-cloud-error";
import { DB_TABLES } from "@/database/supabase/types";
import type { DbCharacterRow } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

function isMissingCharacterColumnError(error: unknown): boolean {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");
  // PostgREST: Could not find the 'nickname' column of 'characters' in the schema cache
  return (
    /['"]nickname['"]/.test(message) ||
    /['"]status['"]/.test(message) ||
    /['"]intro['"]/.test(message) ||
    (message.includes("schema cache") &&
      (message.includes("nickname") ||
        message.includes("status") ||
        message.includes("intro")))
  );
}

/** 후속 마이그레이션 컬럼을 제외한 기본 행 (미적용 DB 호환) */
function characterToBaseRow(
  character: Character,
  userId: string,
): DbCharacterRow {
  return {
    id: character.id,
    project_id: character.projectId,
    user_id: userId,
    name: character.name,
    role: character.role,
    age: character.age,
    gender: character.gender,
    occupation: character.occupation,
    personality: character.personality,
    goal: character.goal,
    secret: character.secret,
    memo: character.memo,
    image: character.image,
    color: character.color,
    is_favorite: character.isFavorite,
    sort_order: character.sortOrder,
    created_at: character.createdAt,
    updated_at: character.updatedAt,
  };
}

export async function cloudListCharacters(): Promise<Character[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.characters)
    .select("*")
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
  return (data ?? []).map(rowToCharacter);
}

export async function cloudListCharactersByProject(
  projectId: string,
): Promise<Character[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.characters)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) throw toCloudError(error);
  return (data ?? []).map(rowToCharacter);
}

export async function cloudUpsertCharacter(character: Character): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = characterToRow(character, userId);

  const first = await client.from(DB_TABLES.characters).upsert(row);
  if (!first.error) return;

  // 선택 컬럼 미적용 DB: 기본 컬럼만으로 재시도
  if (isMissingCharacterColumnError(first.error)) {
    const retry = await client
      .from(DB_TABLES.characters)
      .upsert(characterToBaseRow(character, userId));
    if (!retry.error) return;
    throw toCloudError(retry.error, "캐릭터 저장에 실패했습니다.");
  }

  throw toCloudError(first.error, "캐릭터 저장에 실패했습니다.");
}

export async function cloudDeleteCharacter(characterId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.characters)
    .delete()
    .eq("id", characterId)
    .eq("user_id", userId);

  if (error) throw toCloudError(error, "캐릭터 삭제에 실패했습니다.");
}
