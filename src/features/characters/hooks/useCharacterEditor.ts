"use client";

/**
 * =============================================================================
 * useCharacterEditor
 * -----------------------------------------------------------------------------
 * 인물 프로필 자유 에디터 — Manuscript와 동일한 자동 저장 패턴.
 * =============================================================================
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Character } from "@/features/characters/types/character";
import type { CharacterId } from "@/types/ids";
import {
  CHARACTER_CONTENT_TEMPLATE,
  updateCharacter,
  type CharacterInput,
} from "@/features/characters/lib/character-storage";
import type { SaveStatus } from "@/features/manuscript/hooks/useManuscript";

const AUTOSAVE_MS = 800;

export interface UseCharacterEditorResult {
  content: string;
  setContent: (value: string) => void;
  image: string;
  color: string;
  setMeta: (patch: { image?: string; color?: string }) => void;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  displayName: string;
  saveNow: () => void;
}

export function useCharacterEditor(
  character: Character | null,
  onSaved?: (character: Character) => void,
): UseCharacterEditorResult {
  const [content, setContentState] = useState("");
  const [image, setImage] = useState("");
  const [color, setColor] = useState("");
  const [displayName, setDisplayName] = useState("새 캐릭터");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const contentRef = useRef(content);
  const imageRef = useRef(image);
  const colorRef = useRef(color);
  const characterIdRef = useRef<CharacterId | null>(null);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSavedRef = useRef(onSaved);

  contentRef.current = content;
  imageRef.current = image;
  colorRef.current = color;
  onSavedRef.current = onSaved;

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    dirtyRef.current = false;

    if (!character) {
      characterIdRef.current = null;
      setContentState("");
      setImage("");
      setColor("");
      setDisplayName("새 캐릭터");
      setSaveStatus("idle");
      setLastSavedAt(null);
      return;
    }

    characterIdRef.current = character.id;
    setContentState(
      character.content.trim().length > 0
        ? character.content
        : CHARACTER_CONTENT_TEMPLATE,
    );
    setImage(character.image);
    setColor(character.color);
    setDisplayName(character.name);
    setSaveStatus("idle");
    setLastSavedAt(character.updatedAt);
  }, [character]);

  const persist = useCallback((input: CharacterInput) => {
    const id = characterIdRef.current;
    if (!id) return;

    setSaveStatus("saving");
    void (async () => {
      try {
        const saved = await updateCharacter(id, input);
        if (!saved || characterIdRef.current !== id) return;
        dirtyRef.current = false;
        setDisplayName(saved.name);
        setLastSavedAt(saved.updatedAt);
        setSaveStatus("saved");
        onSavedRef.current?.(saved);
      } catch {
        if (characterIdRef.current === id) setSaveStatus("error");
      }
    })();
  }, []);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setSaveStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      persist({
        content: contentRef.current,
        image: imageRef.current,
        color: colorRef.current,
      });
    }, AUTOSAVE_MS);
  }, [persist]);

  const setContent = useCallback(
    (value: string) => {
      setContentState(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const setMeta = useCallback(
    (patch: { image?: string; color?: string }) => {
      if (patch.image !== undefined) {
        setImage(patch.image);
        imageRef.current = patch.image;
      }
      if (patch.color !== undefined) {
        setColor(patch.color);
        colorRef.current = patch.color;
      }
      scheduleSave();
    },
    [scheduleSave],
  );

  const saveNow = useCallback(() => {
    if (!characterIdRef.current) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    persist({
      content: contentRef.current,
      image: imageRef.current,
      color: colorRef.current,
    });
  }, [persist]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (characterIdRef.current && dirtyRef.current) {
        void updateCharacter(characterIdRef.current, {
          content: contentRef.current,
          image: imageRef.current,
          color: colorRef.current,
        });
      }
    };
  }, []);

  return {
    content,
    setContent,
    image,
    color,
    setMeta,
    saveStatus,
    lastSavedAt,
    displayName,
    saveNow,
  };
}
