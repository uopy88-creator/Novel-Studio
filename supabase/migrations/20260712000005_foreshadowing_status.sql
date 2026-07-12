-- =============================================================================
-- Foreshadowing 상태 정리
-- -----------------------------------------------------------------------------
-- UI 상태: planted(심음) | pending_payoff(회수 예정) | paid_off(회수 완료)
-- 구 값 planned / dropped 를 planted 로 이관하고 기본값을 planted 로 변경.
-- =============================================================================

update public.foreshadowings
set status = 'planted'
where status in ('planned', 'dropped');

alter table public.foreshadowings
  alter column status set default 'planted';
