/**
 * 클래스 이름 병합 유틸리티
 *
 * Tailwind 클래스를 조건부로 합칠 때 사용한다.
 * 외부 라이브러리 없이 가볍게 유지한다.
 *
 * falsy 값(false, null, undefined, 0, "")은 무시하고
 * 문자열만 공백으로 이어 붙인다.
 *
 * @example
 * cn("px-4", isActive && "bg-ns-accent", className)
 */
export function cn(
  ...inputs: Array<string | number | boolean | null | undefined>
): string {
  return inputs.filter((value): value is string => typeof value === "string" && value.length > 0).join(" ");
}
