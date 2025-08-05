# PowerShell script to convert Arabic and Hebrew comments to English
# This will systematically replace all non-English comments in the project

$commentMappings = @{
    # Arabic comments to English
    'للـ Player فقط مع شروط تحديد الصفحة النشطة' = 'For Player only with active page conditions'
    'تحديد الصفحة النشطة بناءً على الشروط' = 'Determine active page based on conditions'
    'التحقق من الطلب لجلب صورة المستخدم' = 'Check request to fetch user image'
    'المستخدم الحالي في الدردشة' = 'Current user in chat'
    'عند تحميل الصفحة، جلب المحادثات' = 'When page loads, fetch conversations'
    'تحميل المحادثة عند النقر' = 'Load conversation when clicked'
    'إرسال الرسالة عند الضغط على زر "Send" أو Enter' = 'Send message when pressing "Send" button or Enter'
    'عند الضغط على زر Send' = 'When pressing Send button'
    'فقط الجزء الذي عدلناه في secondary-buttons' = 'Only the part we modified in secondary-buttons'
    'حقول مخفية لتخزين الإحداثيات' = 'Hidden fields to store coordinates'
    'رسالة الخطأ أو النجاح ستظهر هنا' = 'Error or success message will appear here'
    'Cards Container - ديناميكي' = 'Cards Container - Dynamic'
    'بطاقات المدير' = 'Admin Cards'
    'سيتم ملؤه باستخدام JavaScript' = 'Will be filled using JavaScript'
    'إدارة الطلبات' = 'Request Management'
    'عرض الطلبات' = 'Display Requests'
    'حالة الطلب' = 'Request Status'
    'قبول الطلب' = 'Accept Request'
    'رفض الطلب' = 'Reject Request'
    'تفاصيل الطلب' = 'Request Details'
    'إدارة المستخدمين' = 'User Management'
    'إدارة الملاعب' = 'Venue Management'
    'إدارة الحجوزات' = 'Booking Management'
    'لوحة التحكم' = 'Dashboard'
    'الصفحة الرئيسية' = 'Home Page'
    'تسجيل الدخول' = 'Login'
    'تسجيل الخروج' = 'Logout'
    'الملف الشخصي' = 'Profile'
    'الإعدادات' = 'Settings'
    'البحث' = 'Search'
    'فلترة' = 'Filter'
    'ترتيب' = 'Sort'
    'إضافة' = 'Add'
    'تعديل' = 'Edit'
    'حذف' = 'Delete'
    'حفظ' = 'Save'
    'إلغاء' = 'Cancel'
    'تأكيد' = 'Confirm'
    'نجح' = 'Success'
    'فشل' = 'Failed'
    'خطأ' = 'Error'
    'تحذير' = 'Warning'
    'معلومات' = 'Information'
    'تحميل' = 'Loading'
    'جاري التحميل' = 'Loading...'
    'تم التحميل' = 'Loaded'
    'جاري الحفظ' = 'Saving...'
    'تم الحفظ' = 'Saved'
    'جاري الإرسال' = 'Sending...'
    'تم الإرسال' = 'Sent'
    'جاري التحديث' = 'Updating...'
    'تم التحديث' = 'Updated'
    'جاري الحذف' = 'Deleting...'
    'تم الحذف' = 'Deleted'
    'لا توجد بيانات' = 'No data'
    'لا توجد نتائج' = 'No results'
    'لا توجد رسائل' = 'No messages'
    'لا توجد إشعارات' = 'No notifications'
    'لا توجد ملفات' = 'No files'
    'لا توجد صور' = 'No images'
    'لا توجد مستندات' = 'No documents'
    'لا توجد تقارير' = 'No reports'
    'لا توجد إحصائيات' = 'No statistics'
    'لا توجد تحليلات' = 'No analytics'
    'لا توجد بيانات للعرض' = 'No data to display'
    'لا توجد نتائج للعرض' = 'No results to display'
    'لا توجد رسائل للعرض' = 'No messages to display'
    'لا توجد إشعارات للعرض' = 'No notifications to display'
    'لا توجد ملفات للعرض' = 'No files to display'
    'لا توجد صور للعرض' = 'No images to display'
    'لا توجد مستندات للعرض' = 'No documents to display'
    'لا توجد تقارير للعرض' = 'No reports to display'
    'لا توجد إحصائيات للعرض' = 'No statistics to display'
    'لا توجد تحليلات للعرض' = 'No analytics to display'
    'عرض الكل' = 'Show All'
    'إخفاء الكل' = 'Hide All'
    'عرض المزيد' = 'Show More'
    'عرض أقل' = 'Show Less'
    'عرض التفاصيل' = 'Show Details'
    'إخفاء التفاصيل' = 'Hide Details'
    'عرض الإعدادات' = 'Show Settings'
    'إخفاء الإعدادات' = 'Hide Settings'
    'عرض الخيارات' = 'Show Options'
    'إخفاء الخيارات' = 'Hide Options'
    'عرض القائمة' = 'Show Menu'
    'إخفاء القائمة' = 'Hide Menu'
    'عرض الشريط الجانبي' = 'Show Sidebar'
    'إخفاء الشريط الجانبي' = 'Hide Sidebar'
    'عرض الشريط العلوي' = 'Show Top Bar'
    'إخفاء الشريط العلوي' = 'Hide Top Bar'
    'عرض الشريط السفلي' = 'Show Bottom Bar'
    'إخفاء الشريط السفلي' = 'Hide Bottom Bar'
    'عرض النافذة المنبثقة' = 'Show Modal'
    'إخفاء النافذة المنبثقة' = 'Hide Modal'
    'عرض التنبيه' = 'Show Alert'
    'إخفاء التنبيه' = 'Hide Alert'
    'عرض الإشعار' = 'Show Notification'
    'إخفاء الإشعار' = 'Hide Notification'
    'عرض الرسالة' = 'Show Message'
    'إخفاء الرسالة' = 'Hide Message'
    'عرض الخطأ' = 'Show Error'
    'إخفاء الخطأ' = 'Hide Error'
    'عرض التحذير' = 'Show Warning'
    'إخفاء التحذير' = 'Hide Warning'
    'عرض النجاح' = 'Show Success'
    'إخفاء النجاح' = 'Hide Success'
    'عرض المعلومات' = 'Show Information'
    'إخفاء المعلومات' = 'Hide Information'
    'عرض التحميل' = 'Show Loading'
    'إخفاء التحميل' = 'Hide Loading'
    'عرض التقدم' = 'Show Progress'
    'إخفاء التقدم' = 'Hide Progress'
    'عرض النسبة المئوية' = 'Show Percentage'
    'إخفاء النسبة المئوية' = 'Hide Percentage'
    'عرض العداد' = 'Show Counter'
    'إخفاء العداد' = 'Hide Counter'
    'عرض المؤقت' = 'Show Timer'
    'إخفاء المؤقت' = 'Hide Timer'
    'عرض التاريخ' = 'Show Date'
    'إخفاء التاريخ' = 'Hide Date'
    'عرض الوقت' = 'Show Time'
    'إخفاء الوقت' = 'Hide Time'
    'عرض التاريخ والوقت' = 'Show Date and Time'
    'إخفاء التاريخ والوقت' = 'Hide Date and Time'
    'عرض الموقع' = 'Show Location'
    'إخفاء الموقع' = 'Hide Location'
    'عرض الإحداثيات' = 'Show Coordinates'
    'إخفاء الإحداثيات' = 'Hide Coordinates'
    'عرض الخريطة' = 'Show Map'
    'إخفاء الخريطة' = 'Hide Map'
    'عرض الصورة' = 'Show Image'
    'إخفاء الصورة' = 'Hide Image'
    'عرض الفيديو' = 'Show Video'
    'إخفاء الفيديو' = 'Hide Video'
    'عرض الصوت' = 'Show Audio'
    'إخفاء الصوت' = 'Hide Audio'
    'عرض الملف' = 'Show File'
    'إخفاء الملف' = 'Hide File'
    'عرض المستند' = 'Show Document'
    'إخفاء المستند' = 'Hide Document'
    'عرض الرابط' = 'Show Link'
    'إخفاء الرابط' = 'Hide Link'
    'عرض الزر' = 'Show Button'
    'إخفاء الزر' = 'Hide Button'
    'عرض الحقل' = 'Show Field'
    'إخفاء الحقل' = 'Hide Field'
    'عرض النموذج' = 'Show Form'
    'إخفاء النموذج' = 'Hide Form'
    'عرض الجدول' = 'Show Table'
    'إخفاء الجدول' = 'Hide Table'
    'عرض القائمة' = 'Show List'
    'إخفاء القائمة' = 'Hide List'
    'عرض البطاقة' = 'Show Card'
    'إخفاء البطاقة' = 'Hide Card'
    'عرض الصندوق' = 'Show Box'
    'إخفاء الصندوق' = 'Hide Box'
    'عرض الحاوية' = 'Show Container'
    'إخفاء الحاوية' = 'Hide Container'
    'عرض القسم' = 'Show Section'
    'إخفاء القسم' = 'Hide Section'
    'عرض الفقرة' = 'Show Paragraph'
    'إخفاء الفقرة' = 'Hide Paragraph'
    'عرض العنوان' = 'Show Title'
    'إخفاء العنوان' = 'Hide Title'
    'عرض النص' = 'Show Text'
    'إخفاء النص' = 'Hide Text'
    'عرض الرمز' = 'Show Icon'
    'إخفاء الرمز' = 'Hide Icon'
    'عرض الشعار' = 'Show Logo'
    'إخفاء الشعار' = 'Hide Logo'
    'عرض الصورة الرمزية' = 'Show Avatar'
    'إخفاء الصورة الرمزية' = 'Hide Avatar'
    'عرض الصورة المصغرة' = 'Show Thumbnail'
    'إخفاء الصورة المصغرة' = 'Hide Thumbnail'
    'عرض الصورة الكاملة' = 'Show Full Image'
    'إخفاء الصورة الكاملة' = 'Hide Full Image'
    'عرض الصورة المكبرة' = 'Show Zoomed Image'
    'إخفاء الصورة المكبرة' = 'Hide Zoomed Image'
    'عرض الصورة المصغرة' = 'Show Thumbnail'
    'إخفاء الصورة المصغرة' = 'Hide Thumbnail'
    'عرض الصورة الكاملة' = 'Show Full Image'
    'إخفاء الصورة الكاملة' = 'Hide Full Image'
    'عرض الصورة المكبرة' = 'Show Zoomed Image'
    'إخفاء الصورة المكبرة' = 'Hide Zoomed Image'
}

# Function to convert comments in a file
function Convert-CommentsInFile {
    param([string]$FilePath)
    
    try {
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        if ($content -eq $null) {
            $content = Get-Content -Path $FilePath -Raw -Encoding Default
        }
        
        $originalContent = $content
        $modified = $false
        
        # Replace Arabic/Hebrew comments with English equivalents
        foreach ($arabicComment in $commentMappings.Keys) {
            $englishComment = $commentMappings[$arabicComment]
            
            # Replace in different comment formats
            $patterns = @(
                "// $arabicComment",
                "<!-- $arabicComment -->",
                "/* $arabicComment */",
                "* $arabicComment",
                "# $arabicComment"
            )
            
            foreach ($pattern in $patterns) {
                $englishPattern = $pattern -replace [regex]::Escape($arabicComment), $englishComment
                if ($content -match [regex]::Escape($pattern)) {
                    $content = $content -replace [regex]::Escape($pattern), $englishPattern
                    $modified = $true
                }
            }
        }
        
        # Save the file if modified
        if ($modified) {
            Set-Content -Path $FilePath -Value $content -Encoding UTF8
            Write-Host "✅ Converted comments in: $FilePath" -ForegroundColor Green
            return $true
        }
        
        return $false
    }
    catch {
        Write-Host "❌ Error processing file: $FilePath - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Get all code files
$codeExtensions = @("*.php", "*.html", "*.css", "*.js", "*.sql", "*.md", "*.txt", "*.py", "*.json", "*.xml", "*.yml", "*.yaml", "*.ini", "*.conf")
$excludedDirs = @(".git", "__pycache__", "node_modules", ".vscode", "vendor")

$allFiles = @()
foreach ($ext in $codeExtensions) {
    $files = Get-ChildItem -Path "." -Filter $ext -Recurse -File
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

Write-Host "🔄 Starting comment conversion process..." -ForegroundColor Yellow
Write-Host "📁 Total files to process: $($filteredFiles.Count)" -ForegroundColor Cyan

$convertedCount = 0
$totalFiles = $filteredFiles.Count

foreach ($file in $filteredFiles) {
    $progress = [math]::Round(($convertedCount / $totalFiles) * 100, 1)
    Write-Progress -Activity "Converting Comments" -Status "Processing $($file.Name)" -PercentComplete $progress
    
    if (Convert-CommentsInFile -FilePath $file.FullName) {
        $convertedCount++
    }
}

Write-Progress -Activity "Converting Comments" -Completed

Write-Host "`n🎯 COMMENT CONVERSION COMPLETED!" -ForegroundColor Green
Write-Host "📊 Files processed: $totalFiles" -ForegroundColor Cyan
Write-Host "✅ Files converted: $convertedCount" -ForegroundColor Green
Write-Host "📝 Comments converted to English successfully!" -ForegroundColor Yellow 