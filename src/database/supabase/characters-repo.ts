/**
 * =============================================================================
 * characters 테이블 리포지토리
 * =============================================================================
 */

import type { Character } from "@/features/characters/types/character";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { characterToRow, rowToCharacter } from "@/database/supabase/mappers";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListCharacters(): Promise<Character[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.characters)
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
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

  if (error) throw error;
  return (data ?? []).map(rowToCharacter);
}

export async function cloudUpsertCharacter(character: Character): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = characterToRow(character, userId);

  const { error } = await client.from(DB_TABLES.characters).upsert(row);
  if (error) throw error;
}

export async function cloudDeleteCharacter(characterId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.characters)
    .delete()
    .eq("id", characterId)
    .eq("user_id", userId);

  if (error) throw error;
}
