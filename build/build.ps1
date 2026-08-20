<#
  Backlog Catalog - build script

  Turns build/app_template.html into the two deliverables:
    1. <repo>/index.html            - the STARTER (empty library) that GitHub Pages publishes
    2. <PersonalOut>                - a personal copy pre-seeded from a spreadsheet (optional)

  The template contains the marker  /*__SEED__*/  inside `const SEED = [...]`.
  This script replaces that marker with JSON built from the spreadsheet (or with
  nothing, for the starter).

  The starter also gets its own localStorage key so that opening it locally can
  never read or overwrite the personal library (Chromium shares one storage
  bucket across all file:// pages).

  Usage:
      pwsh -File build/build.ps1
      pwsh -File build/build.ps1 -SeedXlsx "C:\path\to\games.xlsx"
      pwsh -File build/build.ps1 -SkipSeed        # starter only

  No dependencies: reads .xlsx directly as a zip + XML (no Excel, no Python).
#>
param(
  [string]$SeedXlsx    = (Join-Path $env:USERPROFILE 'Downloads\Games Chris has played (1).xlsx'),
  [string]$PersonalOut = (Join-Path $env:USERPROFILE 'Downloads\Backlog Catalog.html'),
  [string]$StarterOut  = (Join-Path $env:USERPROFILE 'Downloads\Backlog Catalog - Starter.html'),
  [switch]$SkipSeed
)

$ErrorActionPreference = 'Stop'

$buildDir = $PSScriptRoot
$repoRoot = Split-Path $buildDir -Parent
$tpl      = Join-Path $buildDir 'app_template.html'
$repoIndex = Join-Path $repoRoot 'index.html'

if (-not (Test-Path $tpl)) { throw "Template not found: $tpl" }
$tplText = [System.IO.File]::ReadAllText($tpl)
if ($tplText -notmatch [regex]::Escape('/*__SEED__*/')) { throw "Template is missing the /*__SEED__*/ marker: $tpl" }
$enc = New-Object System.Text.UTF8Encoding($false)   # UTF-8, no BOM

# ---- single source of version truth: the template's app-version meta tag ----
# Releases bump ONE place. The APP_VERSION constant and the service worker's
# cache name are synced from it here, so they can never drift again.
if ($tplText -notmatch '<meta name="app-version" content="([^"]+)"') { throw "Template has no app-version meta tag" }
$version = $Matches[1]
# fail loudly if the constants ever change shape — a silent no-op here would
# ship a stale version, which is exactly the drift this sync exists to prevent
if ($tplText -notmatch "const APP_VERSION = '[^']*';") { throw "APP_VERSION constant not found in template" }
$tplBefore = $tplText
$tplText = $tplText -replace "const APP_VERSION = '[^']*';", "const APP_VERSION = '$version';"
# keep the source template self-consistent for human readers too
if ($tplText -ne $tplBefore) { [System.IO.File]::WriteAllText($tpl, $tplText, (New-Object System.Text.UTF8Encoding($false))); "template APP_VERSION synced -> v$version" }
$swPath = Join-Path $repoRoot 'sw.js'
if (Test-Path $swPath) {
  $sw = [System.IO.File]::ReadAllText($swPath)
  if ($sw -notmatch "const CACHE = 'backlog-catalog-v[^']*';") { throw "CACHE constant not found in sw.js" }
  $swNew = $sw -replace "const CACHE = 'backlog-catalog-v[^']*';", "const CACHE = 'backlog-catalog-v$version';"
  if ($swNew -ne $sw) { [System.IO.File]::WriteAllText($swPath, $swNew, $enc); "sw.js cache synced -> v$version" }
}

# ---------------------------------------------------------------- helpers ----
function CleanYN([string]$v){
  if($null -eq $v){return ''}
  $t=$v.Trim(); if($t -eq ''){return ''}
  $l=$t.ToLower()
  if($l -eq 'yes'){return 'Yes'}
  if($l -eq 'no'){return 'No'}
  if($l -eq 'n/a' -or $l -eq 'na'){return 'N/A'}
  return $t
}
function JsonStr($s){
  if($null -eq $s){ return '""' }
  $x=[string]$s
  # escape for JSON, and neutralise '<' so nothing can close the <script> block
  $x=$x.Replace('\','\\').Replace('"','\"').Replace([string][char]13,'\r').Replace([string][char]10,'\n').Replace([string][char]9,'\t').Replace('<',([string][char]92+'u003c'))
  return '"'+$x+'"'
}

# ------------------------------------------------- read the seed spreadsheet --
function Get-SeedJson([string]$xlsx){
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip=[System.IO.Compression.ZipFile]::OpenRead($xlsx)
  try {
    function ReadEntry($name){
      $e=$zip.Entries|Where-Object{$_.FullName -eq $name}|Select-Object -First 1
      if(-not $e){return $null}
      $r=New-Object System.IO.StreamReader($e.Open()); $t=$r.ReadToEnd(); $r.Close(); $t
    }
    $shared=New-Object System.Collections.Generic.List[string]
    $ssXml=ReadEntry 'xl/sharedStrings.xml'
    if($ssXml){ $xs=[xml]$ssXml; foreach($si in $xs.sst.si){ $shared.Add([string]$si.InnerText) } }
    $sheetXml=[xml](ReadEntry 'xl/worksheets/sheet1.xml')
  } finally { $zip.Dispose() }

  # columns A-G -> Game, Finished, Want100, Done100, Replayable, Comments, Rating
  $raw=New-Object System.Collections.Generic.List[object]
  foreach($row in $sheetXml.worksheet.sheetData.row){
    $cells=@{}
    foreach($c in $row.c){
      if(-not $c.r){continue}
      $colLetters=($c.r -replace '[0-9]',''); $ci=0
      foreach($ch in $colLetters.ToCharArray()){ $ci=$ci*26+([int][char]$ch-64) }
      if($ci -ge 1 -and $ci -le 7){
        if($c.t -eq 's'){$val=$shared[[int]$c.v]}
        elseif($c.t -eq 'inlineStr'){$val=[string]$c.is.InnerText}
        else {$val=[string]$c.InnerText}
        $cells[$ci]=$val
      }
    }
    $a=New-Object string[] 7
    for($i=1;$i -le 7;$i++){ if($cells.ContainsKey($i)){$a[$i-1]=[string]$cells[$i]} else {$a[$i-1]=''} }
    $raw.Add($a)
  }

  # all-caps rows like "PC GAMES" are platform section headers, not games
  $platformMap=@{ 'PC GAMES'='PC'; 'XBOX GAMES'='Xbox'; 'PLAYSTATION'='PlayStation'; 'NINTENDO'='Nintendo' }
  $objs=New-Object System.Collections.Generic.List[object]
  $curPlat=''; $isFirst=$true
  foreach($r in $raw){
    if($isFirst){$isFirst=$false;continue}                       # header row
    $title=([string]$r[0]).Trim(); if($title -eq ''){continue}
    $key=$title.ToUpper()
    if($platformMap.ContainsKey($key)){ $curPlat=$platformMap[$key]; continue }
    $rating=$null; $rt=([string]$r[6]).Trim()
    if($rt -ne ''){
      $d=0.0
      if([double]::TryParse($rt,[Globalization.NumberStyles]::Any,[Globalization.CultureInfo]::InvariantCulture,[ref]$d)){$rating=$d}
    }
    $fin=(CleanYN ([string]$r[1]))
    $started= if($fin -match '^yes'){'Yes'}else{''}               # only finished games imply "played"
    $objs.Add([PSCustomObject]@{
      title=$title; platform=$curPlat; finished=$fin; started=$started
      want100=(CleanYN ([string]$r[2])); done100=(CleanYN ([string]$r[3]))
      replayable=(CleanYN ([string]$r[4])); rating=$rating; comments=([string]$r[5]).Trim()
    })
  }

  # hand-built JSON: PS 5.1's ConvertTo-Json throws "argument types do not match" on this list
  $ciInv=[Globalization.CultureInfo]::InvariantCulture
  $sb=New-Object System.Text.StringBuilder
  for($k=0;$k -lt $objs.Count;$k++){
    $o=$objs[$k]
    if($k -gt 0){[void]$sb.Append(',')}
    [void]$sb.Append('{"title":'+(JsonStr $o.title))
    [void]$sb.Append(',"platform":'+(JsonStr $o.platform))
    [void]$sb.Append(',"finished":'+(JsonStr $o.finished))
    [void]$sb.Append(',"started":'+(JsonStr $o.started))
    [void]$sb.Append(',"want100":'+(JsonStr $o.want100))
    [void]$sb.Append(',"done100":'+(JsonStr $o.done100))
    [void]$sb.Append(',"replayable":'+(JsonStr $o.replayable))
    $rat= if($null -eq $o.rating){'null'}else{([double]$o.rating).ToString($ciInv)}
    [void]$sb.Append(',"rating":'+$rat)
    [void]$sb.Append(',"comments":'+(JsonStr $o.comments)+'}')
  }
  return @{ Json=$sb.ToString(); Count=$objs.Count }
}

# ------------------------------------------------------------------ build ----
# 1. starter -> repo index.html (this is what gets published) + a local copy
$starterText = $tplText.Replace('/*__SEED__*/','').Replace("const LS_KEY = 'gamesLibrary.v1';","const LS_KEY = 'backlogCatalog.starter.v1';")
[System.IO.File]::WriteAllText($repoIndex, $starterText, $enc)
"Starter -> $repoIndex"
if ($StarterOut) { [System.IO.File]::WriteAllText($StarterOut, $starterText, $enc); "Starter -> $StarterOut" }

# 2. personal seeded copy (skipped if the spreadsheet isn't available)
if (-not $SkipSeed) {
  if (Test-Path $SeedXlsx) {
    $seed = Get-SeedJson $SeedXlsx
    [System.IO.File]::WriteAllText($PersonalOut, $tplText.Replace('/*__SEED__*/', $seed.Json), $enc)
    "Personal ($($seed.Count) games) -> $PersonalOut"
  } else {
    "Seed spreadsheet not found, skipping personal copy: $SeedXlsx"
  }
}

"Built version $version"
