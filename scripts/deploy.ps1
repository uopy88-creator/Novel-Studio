# =============================================================================
# Novel Studio — deploy.ps1
# -----------------------------------------------------------------------------
# 기능 개발 완료 후, 명령 하나로:
#   테스트(lint/build) → Backup Tag → Commit → Push → (Vercel 자동 배포)
#
# 사용법 (프로젝트 루트):
#   npm run deploy
#   또는
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy.ps1
#
# 순서:
#   ① npm run lint          — 실패 시 즉시 종료
#   ② npm run build         — 실패 시 즉시 종료
#   ③ Backup Tag 생성       — backup-YYYY-MM-DD-HHmm → push --tags
#   ④ git add .
#   ⑤ Commit Message 입력
#   ⑥ git commit
#   ⑦ git push
#   ⑧ 완료 체크리스트 출력
#
# 실패 시: lint / build / tag / commit / push 모두 이유를 출력하고 종료합니다.
# 이 스크립트는 Git·품질 자동화만 담당하며, 앱 기능 코드는 변경하지 않습니다.
# =============================================================================

$ErrorActionPreference = "Stop"

# -----------------------------------------------------------------------------
# 헬퍼: 실패 시 이유를 남기고 종료
# -----------------------------------------------------------------------------
function Exit-WithReason {
    param(
        [Parameter(Mandatory = $true)][string]$Step,
        [Parameter(Mandatory = $true)][string]$Reason,
        [int]$Code = 1
    )
    Write-Host ""
    Write-Host "--------------------------------" -ForegroundColor Red
    Write-Host "실패: $Step" -ForegroundColor Red
    Write-Host "이유: $Reason" -ForegroundColor Red
    Write-Host "--------------------------------" -ForegroundColor Red
    Write-Host ""
    exit $Code
}

# 스크립트 위치와 무관하게 항상 프로젝트 루트에서 실행
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Novel Studio Deploy"
Write-Host " 경로: $ProjectRoot"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# ① Lint
# -----------------------------------------------------------------------------
Write-Host "[1/7] npm run lint ..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Exit-WithReason -Step "lint" -Reason "npm run lint 가 실패했습니다. (exit code: $LASTEXITCODE)" -Code $LASTEXITCODE
}
Write-Host "OK: lint" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# ② Build
# -----------------------------------------------------------------------------
Write-Host "[2/7] npm run build ..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Exit-WithReason -Step "build" -Reason "npm run build 가 실패했습니다. (exit code: $LASTEXITCODE)" -Code $LASTEXITCODE
}
Write-Host "OK: build" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# ③ Backup Tag (현재 HEAD 스냅샷) → tags push
#    예) backup-2026-07-11-2130
#    ※ 새 커밋 이전의 HEAD를 태그로 남겨, 롤백 지점을 확보합니다.
# -----------------------------------------------------------------------------
Write-Host "[3/7] Backup Tag 생성 ..." -ForegroundColor Yellow

$stamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$BackupTag = "backup-$stamp"

# 같은 분에 다시 실행하면 충돌 → 초 단위로 재시도
git rev-parse -q --verify "refs/tags/$BackupTag" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    $stamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
    $BackupTag = "backup-$stamp"
    Write-Host "  동일 분 태그 존재 → $BackupTag 사용" -ForegroundColor DarkYellow
}

git tag $BackupTag
if ($LASTEXITCODE -ne 0) {
    Exit-WithReason -Step "Backup Tag" -Reason "git tag $BackupTag 생성에 실패했습니다. (exit code: $LASTEXITCODE)" -Code $LASTEXITCODE
}

Write-Host "  태그: $BackupTag" -ForegroundColor Cyan
git push origin --tags
if ($LASTEXITCODE -ne 0) {
    Exit-WithReason -Step "Backup Tag push" -Reason "git push origin --tags 실패. 원격 권한·네트워크를 확인하세요. (exit code: $LASTEXITCODE)" -Code $LASTEXITCODE
}
Write-Host "OK: Backup Tag" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# ④ git add .
# -----------------------------------------------------------------------------
Write-Host "[4/7] git add ." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Exit-WithReason -Step "git add" -Reason "git add . 실패. (exit code: $LASTEXITCODE)" -Code $LASTEXITCODE
}
Write-Host "OK: staging" -ForegroundColor Green
Write-Host ""

# 스테이징된 변경이 없으면 commit/push 할 내용이 없음
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "스테이징된 변경이 없습니다. commit / branch push 를 건너뜁니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "--------------------------------"
    Write-Host "✔ Lint 완료"
    Write-Host "✔ Build 완료"
    Write-Host "✔ Backup Tag 생성 ($BackupTag)"
    Write-Host "· Git Commit 건너뜀 (변경 없음)"
    Write-Host "· Git Push 건너뜀 (변경 없음)"
    Write-Host "--------------------------------"
    Write-Host ""
    exit 0
}

# -----------------------------------------------------------------------------
# ⑤ Commit Message 입력
# -----------------------------------------------------------------------------
Write-Host "[5/7] Commit Message 를 입력하세요." -ForegroundColor Yellow
Write-Host "  예) feat(scene): improve navigator"
Write-Host ""
$CommitMessage = Read-Host "Commit Message"

if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    Exit-WithReason -Step "Commit Message" -Reason "Commit Message 가 비어 있습니다. 메시지를 입력한 뒤 다시 실행하세요."
}

# -----------------------------------------------------------------------------
# ⑥ git commit
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "[6/7] git commit ..." -ForegroundColor Yellow
git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    Exit-WithReason -Step "git commit" -Reason "git commit 실패. 훅 거부·사용자 설정·메시지 문제를 확인하세요. (exit code: $LASTEXITCODE)" -Code $LASTEXITCODE
}
Write-Host "OK: commit" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# ⑦ git push (브랜치) — Vercel이 GitHub 연동 시 자동 배포 시작
# -----------------------------------------------------------------------------
Write-Host "[7/7] git push ..." -ForegroundColor Yellow
git push
if ($LASTEXITCODE -ne 0) {
    $Branch = (git rev-parse --abbrev-ref HEAD).Trim()
    Write-Host "upstream 없거나 push 실패 → origin/$Branch 로 재시도..." -ForegroundColor DarkYellow
    git push -u origin HEAD
    if ($LASTEXITCODE -ne 0) {
        Exit-WithReason -Step "git push" -Reason "git push 실패. 원격·권한·충돌을 확인하세요. (exit code: $LASTEXITCODE)" -Code $LASTEXITCODE
    }
}
Write-Host "OK: push" -ForegroundColor Green

# -----------------------------------------------------------------------------
# ⑧ 완료
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "--------------------------------"
Write-Host "✔ Lint 완료"
Write-Host "✔ Build 완료"
Write-Host "✔ Backup Tag 생성"
Write-Host "✔ Git Commit 완료"
Write-Host "✔ Git Push 완료"
Write-Host ""
Write-Host "Vercel에서 자동 배포가 시작됩니다."
Write-Host "--------------------------------"
Write-Host ""
exit 0
