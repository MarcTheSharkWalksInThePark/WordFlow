$ErrorActionPreference='Stop'
$repoRoot=[IO.Path]::GetFullPath((Resolve-Path (Join-Path $PSScriptRoot '../../../..')).Path)
$taskTempRoot=[IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'Temp'))
$ccRoot=Join-Path $taskTempRoot 'claude'
$scratchRoot=Join-Path $ccRoot 'C--Users-Marcu-Documents-WordFlow/b5e64aff-57bf-4527-a98a-7b6d342bad63/scratchpad'
$results=@()
function PublicPath($path) { $path.Replace($env:USERPROFILE,'<home>').Replace($env:USERPROFILE.Replace('\','/'),'<home>') }
# Worktree must be removed before its owning clone; every target is independently checked.
foreach($name in @('wf-master','wf-review','ev','tmp','emptyhome','ptest')) {
 $target=[IO.Path]::GetFullPath((Join-Path $scratchRoot $name))
 $row=[ordered]@{path=(PublicPath $target);status='';reason=''}
 if(!(Test-Path -LiteralPath $target)) { $row.status='already absent' }
 elseif(!$target.StartsWith($taskTempRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) {
  $row.status='skipped';$row.reason='not under the temporary directory'
 } elseif($target.Equals($repoRoot,[StringComparison]::OrdinalIgnoreCase) -or $target.StartsWith($repoRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) {
  $row.status='skipped';$row.reason='canonical repository or inside it'
 } elseif((Get-Item -LiteralPath $target).Attributes -band [IO.FileAttributes]::ReparsePoint) {
  $row.status='skipped';$row.reason='reparse point'
 } elseif(!(Test-Path -LiteralPath (Join-Path $target '.git'))) {
  $row.status='skipped';$row.reason='not a git clone/worktree; no .git entry'
 } else {
  $origin=(& git -C $target remote get-url origin 2>$null)
  if($LASTEXITCODE -ne 0) { $row.status='skipped';$row.reason='origin cannot be verified' }
  else {
   $normalized=$origin.Trim().Replace('\','/').TrimEnd('/')
   $allowed=@($repoRoot.Replace('\','/'),'https://github.com/MarcTheSharkWalksInThePark/WordFlow','https://github.com/MarcTheSharkWalksInThePark/WordFlow.git','git@github.com:MarcTheSharkWalksInThePark/WordFlow.git')
   if($normalized -notin $allowed) { $row.status='skipped';$row.reason='origin is not local/GitHub WordFlow' }
   else {
    $row.origin=PublicPath $origin
    Remove-Item -LiteralPath $target -Recurse -Force
    if(Test-Path -LiteralPath $target) { throw 'Deletion did not remove verified target' }
    $row.status='deleted';$row.reason='temporary path, outside canonical repository, verified WordFlow origin'
   }
  }
 }
 $results+=$row
}
foreach($prefix in @('1cf8e1c2','9da28215')) {
 $matches=@(Get-ChildItem -LiteralPath $ccRoot -Directory -Recurse -Depth 1 | Where-Object { $_.Name -like "$prefix*" })
 if($matches.Count) { foreach($entry in $matches) { $results+=@{path=(PublicPath $entry.FullName);status='skipped';reason='session parent is not an independently verified clone; inspect individually'} } }
 else { $results+=@{path="<home>/AppData/Local/Temp/claude/<project>/$prefix-.../";status='already absent';reason='no session directory matches the earlier report prefix'} }
}
$results+=@{path=(PublicPath $scratchRoot)+'/probe scripts';status='skipped';reason='loose scripts are not verified clone directories'}
$results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'cleanup.json') -Encoding utf8
$results | Format-Table path,status,reason -Wrap
