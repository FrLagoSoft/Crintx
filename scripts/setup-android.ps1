# Run from a fresh clone to provision free tools entirely inside this repository.
# Running this setup installs Android SDK packages under Google's standard SDK terms.
$ErrorActionPreference='Stop'
$repoRoot=Split-Path $PSScriptRoot -Parent
$tooling=Join-Path $repoRoot '.tooling'
$downloads=Join-Path $tooling 'downloads'
New-Item -ItemType Directory -Force $downloads | Out-Null

function Download-Verified([string]$Url, [string]$Path, [string]$Algorithm, [string]$Expected) {
  if ((Test-Path -LiteralPath $Path) -and (Get-FileHash -LiteralPath $Path -Algorithm $Algorithm).Hash -eq $Expected) { return }
  Invoke-WebRequest -Uri $Url -OutFile "$Path.part"
  if ((Get-FileHash -LiteralPath "$Path.part" -Algorithm $Algorithm).Hash -ne $Expected) { throw "Checksum mismatch for $Url" }
  Move-Item -LiteralPath "$Path.part" -Destination $Path -Force
}

$jdkAssets=Invoke-RestMethod 'https://api.adoptium.net/v3/assets/latest/17/hotspot?architecture=x64&image_type=jdk&os=windows&vendor=eclipse'
$jdk=$jdkAssets[0].binary.package
Download-Verified $jdk.link (Join-Path $downloads 'jdk17.zip') 'SHA256' $jdk.checksum
Expand-Archive -LiteralPath (Join-Path $downloads 'jdk17.zip') -DestinationPath (Join-Path $tooling 'java') -Force
$env:JAVA_HOME=(Get-ChildItem (Join-Path $tooling 'java') -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName

$toolsArchive=Join-Path $downloads 'android-tools.zip'
Download-Verified 'https://dl.google.com/android/repository/commandlinetools-win-16111833_latest.zip' $toolsArchive 'SHA1' '57d04f2d75eb8e8fffc5000a987e5de4b5a63e9d'
Expand-Archive -LiteralPath $toolsArchive -DestinationPath (Join-Path $tooling 'android-tools') -Force
$env:ANDROID_HOME=Join-Path $tooling 'android-sdk'
$env:ANDROID_USER_HOME=Join-Path $repoRoot '.cache/android-user'
New-Item -ItemType Directory -Force $env:ANDROID_HOME,$env:ANDROID_USER_HOME | Out-Null
$android=Join-Path $tooling 'android-tools/cmdline-tools/bin/android.exe'
& $android --no-metrics "--sdk=$env:ANDROID_HOME" sdk install 'platform-tools' 'platforms/android-36' 'build-tools/36.0.0' 'ndk/27.1.12297006' 'cmake/3.22.1'
if ($LASTEXITCODE -ne 0) { throw 'SDK installer reported an error. Inspect its output before continuing.' }
foreach ($required in @('platform-tools/adb.exe','platforms/android-36/android.jar','build-tools/36.0.0/aapt.exe','ndk/27.1.12297006/source.properties','cmake/3.22.1/bin/cmake.exe')) {
  if (-not (Test-Path -LiteralPath (Join-Path $env:ANDROID_HOME $required))) { throw "Missing SDK component: $required" }
}
Write-Output 'Repo-local Android tools ready. Install frontend dependencies with npm ci, then run scripts/build-android.ps1.'
