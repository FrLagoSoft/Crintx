param([switch]$SkipPrebuild, [ValidateSet('arm64-v8a','x86_64')][string]$Architecture = 'arm64-v8a')
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$jdk = Get-ChildItem (Join-Path $repoRoot '.tooling/java') -Directory | Select-Object -First 1
if (-not $jdk) { throw 'Install a JDK under .tooling/java first. See docs/BUILD_AND_DEMO.md.' }
$env:JAVA_HOME = $jdk.FullName
$env:ANDROID_HOME = Join-Path $repoRoot '.tooling/android-sdk'
$env:ANDROID_USER_HOME = Join-Path $repoRoot '.cache/android-user'
$env:GRADLE_USER_HOME = Join-Path $repoRoot '.cache/gradle'
$env:TEMP = Join-Path $repoRoot '.cache/tmp'
$env:TMP = $env:TEMP
$env:EXPO_NO_TELEMETRY = '1'
$env:EXPO_NO_DOTENV = '1'
$env:EXPO_OFFLINE = '1'
$env:CI = '1'
$env:NODE_ENV = 'production'
New-Item -ItemType Directory -Force $env:TEMP,$env:GRADLE_USER_HOME,$env:ANDROID_USER_HOME | Out-Null
Push-Location (Join-Path $repoRoot 'frontend')
try {
  if (-not $SkipPrebuild) {
    & npx.cmd expo prebuild --platform android --no-install
    if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild failed.' }
  }
  Push-Location android
  try {
    # Build the generic CPU fallback and one optimized CPU variant for the target ABI.
    # No GPU/DSP runtime is used by this prototype; avoid compiling unused variants.
    $variants = if ($Architecture -eq 'arm64-v8a') { 'rnllama,rnllama_v8_2_dotprod_i8mm' } else { 'rnllama,rnllama_x86_64' }
    & ./gradlew.bat :app:assembleRelease "-PreactNativeArchitectures=$Architecture" "-PrnllamaVariants=$variants" '--no-daemon' '--max-workers=2' '--console=plain'
    if ($LASTEXITCODE -ne 0) { throw 'Android release build failed.' }
  } finally { Pop-Location }
  $artifacts = Join-Path $repoRoot 'artifacts'
  New-Item -ItemType Directory -Force $artifacts | Out-Null
  $suffix = if ($Architecture -eq 'arm64-v8a') { 'arm64' } else { 'x86_64-emulator' }
  $output = Join-Path $artifacts "crintx-offline-$suffix.apk"
  Copy-Item 'android/app/build/outputs/apk/release/app-release.apk' $output
  Get-FileHash $output -Algorithm SHA256
} finally { Pop-Location }
