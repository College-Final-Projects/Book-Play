# PowerShell script to create a massive organized code backup file
# This will create complete-project-backup.txt with all code organized by type

$outputFile = "complete-project-backup.txt"
$codeExtensions = @("*.php", "*.html", "*.css", "*.js", "*.sql", "*.md", "*.txt", "*.py", "*.json", "*.xml", "*.yml", "*.yaml", "*.ini", "*.conf")
$excludedDirs = @(".git", "__pycache__", "node_modules", ".vscode")

# Clear the output file
"" | Out-File -FilePath $outputFile -Encoding UTF8

# Function to get all files recursively
function Get-AllCodeFiles {
    param([string]$Path)
    
    $allFiles = @()
    foreach ($ext in $codeExtensions) {
        $files = Get-ChildItem -Path $Path -Filter $ext -Recurse -File
        $allFiles += $files
    }
    
    # Filter out excluded directories
    $filteredFiles = @()
    foreach ($file in $allFiles) {
        $exclude = $false
        foreach ($excludedDir in $excludedDirs) {
            if ($file.FullName -like "*\$excludedDir\*") {
                $exclude = $true
                break
            }
        }
        if (-not $exclude) {
            $filteredFiles += $file
        }
    }
    
    return $filteredFiles
}

# Get all code files
$allFiles = Get-AllCodeFiles -Path "."

# Group files by extension
$filesByType = @{}
foreach ($file in $allFiles) {
    $ext = $file.Extension.ToLower()
    if (-not $filesByType.ContainsKey($ext)) {
        $filesByType[$ext] = @()
    }
    $filesByType[$ext] += $file
}

# Calculate total lines
$totalLines = 0
foreach ($file in $allFiles) {
    try {
        $lines = Get-Content $file.FullName | Measure-Object -Line
        $totalLines += $lines.Lines
    }
    catch {
        # If we can't read the file, estimate based on file size
        $totalLines += [math]::Round($file.Length / 100)
    }
}

# Add header
$header = @"
================================================================================
                    BOOK-PLAY PROJECT - COMPLETE CODE BACKUP
================================================================================

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Total Files: $($allFiles.Count)
Total Lines: ~$totalLines
Project Path: $(Get-Location)

PROJECT STRUCTURE:
- Root files (PHP, SQL, etc.)
- pages/ (User interfaces and functionality)
  - Admin/ (Administrator panels)
  - player/ (Player interfaces)
  - Owner/ (Venue owner interfaces)
  - Facility_Owner/ (Facility management)
  - auth/ (Authentication pages)
- components/ (Reusable components)
- assets/ (CSS, JS, images)
- mail/ (Email templates)
- uploads/ (File uploads)
- TCPDF/ (PDF generation library)

================================================================================
"@

$header | Out-File -FilePath $outputFile -Encoding UTF8 -Append

# Add table of contents
"`nTABLE OF CONTENTS:`n" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
"=" * 80 | Out-File -FilePath $outputFile -Encoding UTF8 -Append

# Create table of contents by file type
$typeNames = @{
    '.html' = 'HTML FILES'
    '.css' = 'CSS FILES'
    '.js' = 'JAVASCRIPT FILES'
    '.php' = 'PHP FILES'
    '.sql' = 'SQL FILES'
    '.md' = 'MARKDOWN FILES'
    '.txt' = 'TEXT FILES'
    '.py' = 'PYTHON FILES'
    '.json' = 'JSON FILES'
    '.xml' = 'XML FILES'
    '.yml' = 'YAML FILES'
    '.yaml' = 'YAML FILES'
    '.ini' = 'CONFIG FILES'
    '.conf' = 'CONFIG FILES'
}

foreach ($ext in ($filesByType.Keys | Sort-Object)) {
    $typeName = if ($typeNames.ContainsKey($ext)) { $typeNames[$ext] } else { "$($ext.ToUpper()) FILES" }
    $fileCount = $filesByType[$ext].Count
    "`n$typeName ($fileCount files):" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    
    foreach ($file in ($filesByType[$ext] | Sort-Object FullName)) {
        $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
        "  - $relativePath" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    }
}

# Process each file type
foreach ($ext in ($filesByType.Keys | Sort-Object)) {
    $typeName = if ($typeNames.ContainsKey($ext)) { $typeNames[$ext] } else { "$($ext.ToUpper()) FILES" }
    $fileCount = $filesByType[$ext].Count
    
    "`n" + "=" * 80 | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    "SECTION: $typeName ($fileCount files)" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    "=" * 80 | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    
    # Process each file in this type
    foreach ($file in ($filesByType[$ext] | Sort-Object FullName)) {
        $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
        
        "`n" + "-" * 60 | Out-File -FilePath $outputFile -Encoding UTF8 -Append
        "FILE: $relativePath" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
        "-" * 60 | Out-File -FilePath $outputFile -Encoding UTF8 -Append
        
        # File information
        try {
            $lines = Get-Content $file.FullName | Measure-Object -Line
            $lineCount = $lines.Lines
        }
        catch {
            $lineCount = "ERROR"
        }
        
        $fileInfo = @"
File Size: $($file.Length) bytes
Lines: $lineCount
Extension: $($file.Extension)
Last Modified: $($file.LastWriteTime)
Full Path: $($file.FullName)

CODE CONTENT:
"@
        $fileInfo | Out-File -FilePath $outputFile -Encoding UTF8 -Append
        
        try {
            # Read file content
            $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
            if ($content -eq $null) {
                $content = Get-Content -Path $file.FullName -Raw -Encoding Default
            }
            
            # Add content with line numbers
            $lines = $content -split "`n"
            for ($i = 0; $i -lt $lines.Count; $i++) {
                $lineNumber = ($i + 1).ToString().PadLeft(4, ' ')
                "$lineNumber : $($lines[$i])" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
            }
        }
        catch {
            "ERROR: Could not read file content - $($_.Exception.Message)" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
        }
        
        "`n" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    }
}

# Add footer with summary
$footer = @"

================================================================================
                                END OF CODE BACKUP
================================================================================

BACKUP SUMMARY:
- Total Files Processed: $($allFiles.Count)
- Total Lines of Code: ~$totalLines
- File Types Included: $($filesByType.Keys.Count)
- Backup Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
- Project: BOOK-PLAY
- Backup File: $outputFile

FILE TYPE BREAKDOWN:
"@

$footer | Out-File -FilePath $outputFile -Encoding UTF8 -Append

foreach ($ext in ($filesByType.Keys | Sort-Object)) {
    $typeName = if ($typeNames.ContainsKey($ext)) { $typeNames[$ext] } else { "$($ext.ToUpper()) FILES" }
    $fileCount = $filesByType[$ext].Count
    "- $typeName : $fileCount files" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
}

"`n" + "=" * 80 | Out-File -FilePath $outputFile -Encoding UTF8 -Append
"BACKUP COMPLETE - ALL PROJECT CODE INCLUDED" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
"=" * 80 | Out-File -FilePath $outputFile -Encoding UTF8 -Append

Write-Host "`n🎯 MASSIVE CODE BACKUP CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "📄 File: $outputFile" -ForegroundColor Yellow
Write-Host "📊 Total Files: $($allFiles.Count)" -ForegroundColor Cyan
Write-Host "📈 Total Lines: ~$totalLines" -ForegroundColor Cyan
Write-Host "🗂️ File Types: $($filesByType.Keys.Count)" -ForegroundColor Cyan

Write-Host "`n📋 FILE TYPE BREAKDOWN:" -ForegroundColor White
foreach ($ext in ($filesByType.Keys | Sort-Object)) {
    $typeName = if ($typeNames.ContainsKey($ext)) { $typeNames[$ext] } else { "$($ext.ToUpper()) FILES" }
    $fileCount = $filesByType[$ext].Count
    Write-Host "  - $typeName : $fileCount files" -ForegroundColor White
}

Write-Host "`n✅ BACKUP COMPLETE! All project code is now in one massive organized file!" -ForegroundColor Green
Write-Host "📖 You can open $outputFile to view all your code organized by file type." -ForegroundColor Yellow 