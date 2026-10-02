# Ralph Loop PowerShell Script
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host "🚀 Starting Ralph Loop for AetherCatalog..." -ForegroundColor Cyan

# Loop until success
$iteration = 1
while ($true) {
    Write-Host "`n=== Iteration $iteration ===" -ForegroundColor Yellow
    
    # Run accuracy test first to see current status
    python test_accuracy.py
    $testExit = $LASTEXITCODE
    
    if ($testExit -eq 0) {
        Write-Host "🎉 Success! Accuracy target met. Exiting Ralph Loop." -ForegroundColor Green
        break
    }
    
    Write-Host "❌ Accuracy test failed. Invoking agent to make fixes..." -ForegroundColor Red
    
    # Run the Claude agent CLI and pipe instructions
    # We pass it the instructions to look at .gsd/spec.md, check test_accuracy.py, make code fixes, commit, and exit.
    "Read .gsd/spec.md, run python test_accuracy.py, fix classification accuracy issues in server.py, commit your changes, and exit." | claude
    
    $iteration++
}
