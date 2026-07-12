/**
 * @deprecated Re-export — use timeline-section-options.ts
 * 구 Chapter/Document 순회 로더는 제거됨. primary Manuscript Section 만 사용.
 */
export {
  type TimelineSectionOption,
  type TimelineSceneOption,
  encodeSectionOptionValue,
  encodeSceneOptionValue,
  decodeSectionOptionValue,
  decodeSceneOptionValue,
  loadTimelineSectionOptions,
  loadTimelineSceneOptions,
} from "./timeline-section-options";
