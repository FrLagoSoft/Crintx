param([Parameter(Mandatory=$true)][string]$ApkPath, [ValidateSet('arm64-v8a','x86_64')][string]$Architecture='arm64-v8a')
$ErrorActionPreference='Stop'
$repoRoot=Split-Path $PSScriptRoot -Parent
$apk=(Resolve-Path -LiteralPath $ApkPath).Path
$aapt=Join-Path $repoRoot '.tooling/android-sdk/build-tools/36.0.0/aapt.exe'
if (-not (Test-Path -LiteralPath $aapt)) { throw 'Android build tools 36.0.0 are required.' }
$permissions=(& $aapt dump permissions $apk) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect APK permissions.' }
if ($permissions -match 'android.permission.INTERNET|android.permission.ACCESS_NETWORK_STATE') { throw 'Release APK still requests network access.' }
$manifest=(& $aapt dump xmltree $apk AndroidManifest.xml) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect APK manifest.' }
if ($manifest -notmatch 'android:allowBackup[^\r\n]*0x0') { throw 'Backup is not explicitly disabled.' }
if ($manifest -match 'android:debuggable[^\r\n]*0xffffffff') { throw 'Release APK is debuggable.' }
if ($manifest -notmatch 'android:dataExtractionRules') { throw 'Android data extraction rules are missing.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::OpenRead($apk)
try {
  $entries=@($zip.Entries | ForEach-Object FullName)
  $bundle=$zip.GetEntry('assets/index.android.bundle')
  if (-not $bundle -or $bundle.Length -lt 1000) { throw 'Embedded JavaScript bundle is missing.' }
  foreach ($library in @('librnllama.so','librnllama_jni.so')) {
    if ($entries -notcontains "lib/$Architecture/$library") { throw "Required native library missing: $library" }
  }
  $report=[ordered]@{
    apk=$apk
    sha256=(Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant()
    architecture=$Architecture
    embeddedBundleBytes=$bundle.Length
    internetPermission=$false
    backupEnabled=$false
    dataExtractionRulesPresent=$true
    nativeLlamaLibrariesPresent=$true
    verificationScope='Static APK inspection only; not proof of launch, inference, BLE or audible ringing.'
  }
} finally { $zip.Dispose() }
$report | ConvertTo-Json | Tee-Object -FilePath "$apk.verification.json"
