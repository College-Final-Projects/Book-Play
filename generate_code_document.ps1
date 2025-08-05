# PowerShell script to generate a comprehensive code document
# This will create a text file with all your project code that you can copy into Word

$outputFile = "BOOK-PLAY_Complete_Code_Documentation.txt"
$codeExtensions = @("*.php", "*.html", "*.css", "*.js", "*.sql", "*.md", "*.txt", "*.py", "*.json", "*.xml", "*.yml", "*.yaml", "*.ini", "*.conf")
$excludedDirs = @(".git", "__pycache__", "node_modules", ".vscode")

# Clear the output file
"" | Out-File -FilePath $outputFile -Encoding UTF8

# Add header
$header = @"
================================================================================
                    BOOK-PLAY PROJECT - COMPLETE CODE DOCUMENTATION
================================================================================

This document contains all the source code files from the BOOK-PLAY project.
Generated automatically for documentation purposes.

Project Structure:
- Root files (PHP, SQL, etc.)
- pages/ (User interfaces and functionality)
- components/ (Reusable components)
- assets/ (CSS, JS, images)
- mail/ (Email templates)
- uploads/ (File uploads)
- TCPDF/ (PDF generation library)

================================================================================
"@

$header | Out-File -FilePath $outputFile -Encoding UTF8 -Append

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

# Group files by directory
$filesByDir = @{}
foreach ($file in $allFiles) {
    $dirName = $file.DirectoryName
    if ($dirName -eq $null) { $dirName = "Root" }
    
    if (-not $filesByDir.ContainsKey($dirName)) {
        $filesByDir[$dirName] = @()
    }
    $filesByDir[$dirName] += $file
}

# Add table of contents
"`nTABLE OF CONTENTS`n" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
"=" * 80 | Out-File -FilePath $outputFile -Encoding UTF8 -Append

foreach ($dirName in ($filesByDir.Keys | Sort-Object)) {
    "`nDirectory: $dirName" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    foreach ($file in ($filesByDir[$dirName] | Sort-Object Name)) {
        $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
        "  - $relativePath" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    }
}

# Process each directory
foreach ($dirName in ($filesByDir.Keys | Sort-Object)) {
    "`n" + "=" * 80 | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    "DIRECTORY: $dirName" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    "=" * 80 | Out-File -FilePath $outputFile -Encoding UTF8 -Append
    
    # Process each file in the directory
    foreach ($file in ($filesByDir[$dirName] | Sort-Object Name)) {
        $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
        
        "`n" + "-" * 60 | Out-File -FilePath $outputFile -Encoding UTF8 -Append
        "FILE: $relativePath" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
        "-" * 60 | Out-File -FilePath $outputFile -Encoding UTF8 -Append
        
        # File information
        $fileInfo = @"
File Size: $($file.Length) bytes
Lines: $(Get-Content $file.FullName | Measure-Object -Line).Lines
Extension: $($file.Extension)
Last Modified: $($file.LastWriteTime)
"@
        $fileInfo | Out-File -FilePath $outputFile -Encoding UTF8 -Append
        
        "`nCODE CONTENT:`n" | Out-File -FilePath $outputFile -Encoding UTF8 -Append
        
        try {
            # Read file content
            $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
            if ($content -eq $null) {
                $content = Get-Content -Path $file.FullName -Raw -Encoding Default
            }
            
            # Add line numbers
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

# Add footer
$footer = @"

================================================================================
                                END OF DOCUMENTATION
================================================================================

Total files processed: $($allFiles.Count)
Document generated on: $(Get-Date)
================================================================================
"@

$footer | Out-File -FilePath $outputFile -Encoding UTF8 -Append

Write-Host "Code documentation generated successfully!" -ForegroundColor Green
Write-Host "Output file: $outputFile" -ForegroundColor Yellow
Write-Host "Total files processed: $($allFiles.Count)" -ForegroundColor Cyan
Write-Host "`nYou can now:" -ForegroundColor White
Write-Host "1. Open the text file: $outputFile" -ForegroundColor White
Write-Host "2. Select all content (Ctrl+A)" -ForegroundColor White
Write-Host "3. Copy (Ctrl+C)" -ForegroundColor White
Write-Host "4. Open Microsoft Word" -ForegroundColor White
Write-Host "5. Paste (Ctrl+V)" -ForegroundColor White
Write-Host "6. Save as .docx file" -ForegroundColor White 