#Requires -Version 5.1
<#
.SYNOPSIS
    Install PersonalKnowledgeBase skills for your AI coding assistant (Windows).

.DESCRIPTION
    Creates symlinks (or copies as fallback) from your platform's skill
    directory to this repo's skills/ folder.

.PARAMETER Platform
    One or more of: cursor, claude, copilot

.PARAMETER Uninstall
    Remove skill symlinks/copies instead of installing.

.EXAMPLE
    .\setup.ps1 cursor
    .\setup.ps1 cursor, claude
    .\setup.ps1 -Uninstall cursor
#>
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet("cursor", "claude", "copilot")]
    [string[]]$Platform,

    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$VERSION = "0.1.0"
$RepoDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Skills = @("compile-wiki", "ask-wiki", "lint-wiki")

function Resolve-TargetDir([string]$p) {
    switch ($p) {
        "cursor"  { return Join-Path $env:USERPROFILE ".cursor\skills" }
        "claude"  { return Join-Path $env:USERPROFILE ".claude\skills" }
        "copilot" { return Join-Path $env:USERPROFILE ".copilot\skills" }
    }
}

function Test-SymlinkSupport {
    $testDir = Join-Path $env:TEMP "pkb_symlink_test_$(Get-Random)"
    $testTarget = Join-Path $env:TEMP "pkb_symlink_target_$(Get-Random)"
    try {
        New-Item -ItemType Directory -Path $testTarget -Force | Out-Null
        New-Item -ItemType SymbolicLink -Path $testDir -Target $testTarget -ErrorAction Stop | Out-Null
        return $true
    }
    catch { return $false }
    finally {
        Remove-Item $testDir -Force -ErrorAction SilentlyContinue
        Remove-Item $testTarget -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Install-Platform([string]$p) {
    $targetDir = Resolve-TargetDir $p
    Write-Host "[$p] Installing skills (v$VERSION) to $targetDir"

    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    foreach ($skill in $Skills) {
        $src = Join-Path $RepoDir "skills\$skill"
        $dst = Join-Path $targetDir $skill

        if (Test-Path $dst) {
            $item = Get-Item $dst -Force
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
                $existing = $item.Target
                if ($existing -eq $src) {
                    Write-Host "  $skill -> already linked (skipped)"
                    continue
                }
                Write-Host "  $skill -> updating link (was: $existing)"
                Remove-Item $dst -Force
            }
            else {
                Write-Host "  $skill -> WARNING: directory exists and is NOT a symlink."
                Write-Host "           Back it up manually if needed, then re-run."
                continue
            }
        }

        if ($script:CanSymlink) {
            New-Item -ItemType SymbolicLink -Path $dst -Target $src | Out-Null
            Write-Host "  $skill -> linked"
        }
        else {
            Copy-Item -Path $src -Destination $dst -Recurse
            Write-Host "  $skill -> copied (symlinks unavailable, see note below)"
        }
    }
    Write-Host "[$p] Done.`n"
}

function Uninstall-Platform([string]$p) {
    $targetDir = Resolve-TargetDir $p
    Write-Host "[$p] Removing skills from $targetDir"

    foreach ($skill in $Skills) {
        $dst = Join-Path $targetDir $skill
        if (Test-Path $dst) {
            $item = Get-Item $dst -Force
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
                Remove-Item $dst -Force
                Write-Host "  $skill -> removed (symlink)"
            }
            else {
                Remove-Item $dst -Recurse -Force
                Write-Host "  $skill -> removed (copy)"
            }
        }
        else {
            Write-Host "  $skill -> not found (skipped)"
        }
    }
    Write-Host "[$p] Uninstalled.`n"
}

# --- Main ---

if ($Uninstall) {
    foreach ($p in $Platform) { Uninstall-Platform $p }
    exit 0
}

$script:CanSymlink = Test-SymlinkSupport

if (-not $script:CanSymlink) {
    Write-Host @"
NOTE: Symlinks are not available. Skills will be copied instead.
      To enable symlinks, turn on Developer Mode:
        Settings > System > For developers > Developer Mode
      Then re-run this script.
      With symlinks, git pull automatically updates your skills.
      With copies, re-run this script after pulling updates.

"@
}

# Create local directories
foreach ($dir in @("raw", "output")) {
    $path = Join-Path $RepoDir $dir
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

# Disconnect from the template origin to prevent accidental pushes
try {
    $originUrl = & git -C $RepoDir remote get-url origin 2>$null
    if ($originUrl -and $originUrl -match "PersonalKnowledgeBaseCreator") {
        Write-Host "Disconnecting from template repository to prevent accidental pushes..."
        & git -C $RepoDir remote rename origin template-origin
        Write-Host "  origin -> renamed to 'template-origin'"
        Write-Host "  To push your wiki to your own repo, run:"
        Write-Host "    git remote add origin <your-repo-url>"
        Write-Host ""
    }
} catch {}

foreach ($p in $Platform) { Install-Platform $p }

Write-Host "Setup complete."
Write-Host ""
Write-Host "Quick start:"
Write-Host "  1. Edit AGENTS.md and fill in your focus areas"
Write-Host "  2. Drop files into raw/"
Write-Host '  3. Open in your AI assistant and say: "Compile the wiki"'
Write-Host "  4. Browse wiki/ in Obsidian"
