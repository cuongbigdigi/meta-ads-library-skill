# Cài Meta Ads Library skill trên Windows (chạy qua cai-dat.bat ở thư mục gốc).
# Các bước: kiểm tra Node.js (thiếu thì tự cài) -> npm install -> tải Chromium -> kiểm tra máy
#           -> cài skill dùng chung cho Claude Code và Codex -> mở agent.
# Ghi toàn bộ quá trình vào cai-dat.log để gửi nhóm Zalo khi cần hỗ trợ.
param(
  [switch]$NoOpen,        # không hỏi mở Claude Code/Codex ở cuối (dùng khi test)
  [string]$SkillHome = $HOME,  # nơi cài skill dùng chung (mặc định thư mục người dùng)
  [string]$DesktopDir = [Environment]::GetFolderPath('Desktop')  # nơi tạo biểu tượng (đổi khi test)
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Log = Join-Path $Root 'cai-dat.log'
try { Start-Transcript -Path $Log -Force | Out-Null } catch {}

$ZALO = 'https://zalo.me/g/37yoic8thaeho75yicnb'
$script:Failed = $false
function Step($n, $t) { Write-Host ''; Write-Host "[$n/6] $t" -ForegroundColor Cyan }
function Ok($t)   { Write-Host "  OK  $t" -ForegroundColor Green }
function Warn($t) { Write-Host "  !!  $t" -ForegroundColor Yellow }
function Fail($t, $fix) {
  $script:Failed = $true
  Write-Host "  LỖI $t" -ForegroundColor Red
  if ($fix) { Write-Host "      Cách sửa: $fix" -ForegroundColor Yellow }
}
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  foreach ($p in @("$env:ProgramFiles\nodejs", "$env:APPDATA\npm")) { if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) { $env:Path = "$p;$env:Path" } }
}
function Node-Major {
  $n = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $n) { return 0 }
  $v = (& node.exe -v) 2>$null
  if ($v -match '^v(\d+)') { return [int]$Matches[1] } else { return 0 }
}
function Finish {
  Write-Host ''
  if ($script:Failed) {
    Write-Host '==========================================================' -ForegroundColor Red
    Write-Host ' Cài đặt CHƯA xong. Làm theo "Cách sửa" bên trên rồi chạy lại cai-dat.bat.' -ForegroundColor Red
    Write-Host " Vẫn không được: gửi file cai-dat.log (trong thư mục này) vào nhóm Zalo:" -ForegroundColor Red
    Write-Host " $ZALO" -ForegroundColor Red
    Write-Host '==========================================================' -ForegroundColor Red
  }
  try { Stop-Transcript | Out-Null } catch {}
  exit ([int]$script:Failed)
}

Write-Host '=========================================================='
Write-Host ' CÀI ĐẶT META ADS LIBRARY SKILL (Windows)'
Write-Host " Thư mục: $Root"
Write-Host ' Lần đầu mất khoảng 3-10 phút tùy mạng. Đừng tắt cửa sổ này.'
Write-Host '=========================================================='

if ($Root -match '\\AppData\\Local\\Temp\\') {
  Warn 'Có vẻ bạn đang chạy trong thư mục tạm (mở thẳng từ file ZIP).'
  Warn 'Nên giải nén ra Desktop hoặc Documents rồi chạy lại, nếu không bộ cài sẽ mất khi Windows dọn rác.'
}

# ---------- 1. Node.js ----------
Step 1 'Kiểm tra Node.js'
Refresh-Path
$major = Node-Major
if ($major -ge 18) {
  Ok "Node.js $((& node.exe -v)) đã có"
} else {
  if ($major -gt 0) { Warn "Node.js v$major quá cũ (cần 18 trở lên), sẽ cài bản mới." } else { Warn 'Chưa có Node.js, đang tự cài bản LTS...' }
  $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
  if ($winget) {
    Write-Host '  Đang cài qua winget (Windows có thể hỏi quyền, bấm Yes)...'
    & winget.exe install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    Refresh-Path
    $major = Node-Major
  }
  if ($major -lt 18) {
    Write-Host '  Đang tải bộ cài Node.js từ nodejs.org...'
    try {
      $idx = Invoke-RestMethod 'https://nodejs.org/dist/index.json' -UseBasicParsing
      $lts = $idx | Where-Object { $_.lts } | Select-Object -First 1
      $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
      $msi = Join-Path $env:TEMP "node-$($lts.version)-$arch.msi"
      Invoke-WebRequest "https://nodejs.org/dist/$($lts.version)/node-$($lts.version)-$arch.msi" -OutFile $msi -UseBasicParsing
      Write-Host '  Đang cài (Windows sẽ hỏi quyền, bấm Yes)...'
      Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /passive /norestart" -Wait -Verb RunAs
      Refresh-Path
      $major = Node-Major
    } catch { Warn "Tải tự động lỗi: $($_.Exception.Message)" }
  }
  if ($major -ge 18) { Ok "Đã cài Node.js $((& node.exe -v))" }
  else {
    Fail 'Không cài được Node.js tự động.' 'mở https://nodejs.org, tải bản LTS, cài xong (bấm Next liên tục) rồi chạy lại cai-dat.bat'
    Start-Process 'https://nodejs.org/vi/download'
    Finish
  }
}

# ---------- 2. Thư viện ----------
Step 2 'Cài thư viện (npm install)'
Push-Location $Root
$okNpm = $false
foreach ($try in 1..2) {
  & npm.cmd install --no-audit --no-fund --loglevel=error --ignore-scripts   # Chromium tải riêng ở bước 3 để báo lỗi rõ hơn
  if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $Root 'node_modules\playwright'))) { $okNpm = $true; break }
  Warn "Lần $try chưa được, thử lại..."
  & npm.cmd cache verify | Out-Null
}
if ($okNpm) { Ok 'Đã cài thư viện' }
else { Fail 'npm install lỗi.' 'kiểm tra mạng (tắt VPN/proxy nếu có), tạm tắt phần mềm diệt virus, rồi chạy lại cai-dat.bat'; Pop-Location; Finish }

# ---------- 3. Chromium ----------
Step 3 'Tải trình duyệt Chromium (khoảng 150 MB, chỉ tải lần đầu)'
$okChrome = $false
foreach ($try in 1..3) {
  & npx.cmd playwright install chromium
  if ($LASTEXITCODE -eq 0) { $okChrome = $true; break }
  Warn "Lần $try chưa được (mạng chập chờn?), thử lại..."
  Start-Sleep -Seconds 5
}
Pop-Location
if ($okChrome) { Ok 'Đã có Chromium' }
else { Fail 'Không tải được Chromium.' 'mạng chậm hoặc bị chặn: đổi mạng khác (ví dụ phát 4G từ điện thoại) rồi chạy lại cai-dat.bat'; Finish }

# ---------- 4. Kiểm tra ----------
Step 4 'Quét thử thư viện quảng cáo'
& node.exe (Join-Path $Root 'tools\ad-library\doctor.js')
if ($LASTEXITCODE -eq 0) { Ok 'Tool chạy được' }
else { Fail 'Quét thử chưa được (xem dòng LỖI ở trên).' 'thường do mạng chặn Facebook. Đổi mạng rồi chạy lại cai-dat.bat' }

# ---------- 5. Skill dùng chung ----------
Step 5 'Cài skill cho Claude Code và Codex (dùng ở mọi thư mục)'
$skillSrc = Join-Path $Root '.claude\skills\meta-ads-library\SKILL.md'
foreach ($agent in @('.claude', '.codex')) {
  $dir = Join-Path $SkillHome "$agent\skills\meta-ads-library"
  try {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Copy-Item $skillSrc (Join-Path $dir 'SKILL.md') -Force
    $rt = Join-Path $dir 'runtime'
    $item = Get-Item $rt -Force -ErrorAction SilentlyContinue
    if ($item -and $item.LinkType -eq 'Junction') { [System.IO.Directory]::Delete($rt) ; $item = $null }
    if ($item) {
      Warn "$agent đã có bản cài cũ ở $rt, giữ nguyên (chỉ cập nhật SKILL.md)."
    } else {
      # Junction: runtime trỏ về thư mục này, không cần quyền admin, không tốn dung lượng
      New-Item -ItemType Junction -Path $rt -Target $Root | Out-Null
      Ok "Đã cài cho $(if ($agent -eq '.claude') {'Claude Code'} else {'Codex'}): $dir"
    }
  } catch { Warn "Không cài được skill cho ${agent}: $($_.Exception.Message)" }
}
Warn 'Đừng xóa hoặc đổi tên thư mục này, skill dùng chung đang trỏ về đây. Lỡ chuyển chỗ thì chạy lại cai-dat.bat.'

# ---------- 6. Mở agent ----------
Step 6 'Tạo biểu tượng ngoài Desktop và mở hướng dẫn'
$claude = Get-Command claude -ErrorAction SilentlyContinue
$codex = Get-Command codex -ErrorAction SilentlyContinue
$guide = Join-Path $Root 'huong-dan.html'
try {
  $ws = New-Object -ComObject WScript.Shell
  function New-Shortcut($name, $target, $arguments, $desc) {
    $lnk = $ws.CreateShortcut((Join-Path $DesktopDir "$name.lnk"))
    $lnk.TargetPath = $target
    if ($arguments) { $lnk.Arguments = $arguments }
    $lnk.WorkingDirectory = $Root
    $lnk.Description = $desc
    $lnk.Save()
  }
  New-Shortcut 'Huong dan Meta Ads Library' $guide $null 'Cách dùng skill soi quảng cáo đối thủ, câu lệnh mẫu'
  Ok 'Biểu tượng "Huong dan Meta Ads Library" (mở lại hướng dẫn bất cứ lúc nào)'
  if ($claude) { New-Shortcut 'Soi ads doi thu (Claude Code)' "$env:ComSpec" "/k cd /d `"$Root`" && claude" 'Mở Claude Code để soi quảng cáo đối thủ'; Ok 'Biểu tượng "Soi ads doi thu (Claude Code)"' }
  if ($codex) { New-Shortcut 'Soi ads doi thu (Codex)' "$env:ComSpec" "/k cd /d `"$Root`" && codex" 'Mở Codex để soi quảng cáo đối thủ'; Ok 'Biểu tượng "Soi ads doi thu (Codex)"' }
} catch { Warn "Không tạo được biểu tượng Desktop: $($_.Exception.Message)" }

if (-not $claude -and -not $codex) {
  Warn 'Chưa thấy Claude Code/Codex dạng dòng lệnh. Dùng app Claude hoặc Codex trên máy tính cũng được.'
  Warn 'Chưa có app nào thì xem video cài trong trang hướng dẫn:'
  Write-Host '      Cài Codex:       https://www.facebook.com/reel/1051710833986249'
  Write-Host '      Cài Claude Code: https://www.youtube.com/watch?v=ON6H2YbnoVg'
}

Write-Host ''
Write-Host '  ---------------------------------------------------------' -ForegroundColor White
Write-Host '  DÙNG THẾ NÀO TIẾP THEO?' -ForegroundColor White
Write-Host '  1. KHÔNG gõ từ khóa vào cửa sổ đen này. Cửa sổ này chỉ để cài.' -ForegroundColor White
Write-Host '  2. Đang mở Claude Code / Codex thì TẮT HẲN rồi MỞ LẠI (để nhận skill mới).' -ForegroundColor White
Write-Host '  3. Mở agent (biểu tượng "Soi ads doi thu" ngoài Desktop, hoặc app Claude/Codex),' -ForegroundColor White
Write-Host '     gõ vào ô chat bằng tiếng Việt, ví dụ:' -ForegroundColor White
Write-Host '     Soi đối thủ ngành nến thơm, cho anh top 10 ad thắng và phân tích.' -ForegroundColor Yellow
Write-Host '  4. Agent xin phép chạy lệnh thì chọn Yes / Allow.' -ForegroundColor White
Write-Host '  Đang mở trang hướng dẫn chi tiết (có câu lệnh mẫu bấm Copy)...' -ForegroundColor White
Write-Host '  ---------------------------------------------------------' -ForegroundColor White
if (-not $NoOpen) {
  Start-Process $guide
  if ($claude -or $codex) {
    $pick = if ($claude -and $codex) { Read-Host '  Mở agent ngay? Gõ 1 = Claude Code, 2 = Codex, Enter = để sau' }
            elseif ($claude) { if ((Read-Host '  Mở Claude Code ngay? (c/k)') -match '^[cCyY]') { '1' } }
            else { if ((Read-Host '  Mở Codex ngay? (c/k)') -match '^[cCyY]') { '2' } }
    if ($pick -eq '1') { Start-Process $env:ComSpec -ArgumentList "/k cd /d `"$Root`" && claude" }
    if ($pick -eq '2') { Start-Process $env:ComSpec -ArgumentList "/k cd /d `"$Root`" && codex" }
  }
}
if (-not $script:Failed) { Write-Host ''; Write-Host ' CÀI ĐẶT HOÀN TẤT' -ForegroundColor Green }
Finish
