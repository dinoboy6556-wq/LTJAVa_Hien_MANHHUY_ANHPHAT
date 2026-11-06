param([string]$ApiBaseUrl='http://localhost:8080/api/v1',[string]$AdminEmail='admin@library.com',[System.Security.SecureString]$AdminPassword)
$ErrorActionPreference='Stop'
if(-not $AdminPassword){$AdminPassword=Read-Host 'Mật khẩu quản trị' -AsSecureString}
$credential=[System.Management.Automation.PSCredential]::new($AdminEmail,$AdminPassword)
$body=@{email=$AdminEmail;password=$credential.GetNetworkCredential().Password}|ConvertTo-Json -Compress
$auth=Invoke-RestMethod -Uri "$ApiBaseUrl/auth/login" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body));$body=$null
$headers=@{Authorization='Bearer '+$auth.token}
$books=@(foreach($book in (Invoke-RestMethod -Uri "$ApiBaseUrl/books" -Headers $headers)){$book})
$data=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'sample_library_content.json') -Raw -Encoding UTF8|ConvertFrom-Json
$existing=@{};foreach($kind in @('EBOOK','POST','PAGE','CONFIG','MENU')){foreach($row in (Invoke-RestMethod -Uri "$ApiBaseUrl/content/manage/$kind" -Headers $headers)){$existing[$row.slug]=$true}}
$added=0;$skipped=0
foreach($entry in $data){if($existing.ContainsKey($entry.slug)){$skipped++;continue};$record=@{title=$entry.title;slug=$entry.slug;body=$entry.body;link=$entry.link;sortOrder=$entry.sortOrder;published=$entry.published};if($entry.kind -eq 'EBOOK'){if($books.Count -eq 0){throw 'Cần ít nhất một đầu sách trước khi nạp bài đọc mẫu'};$record.bookId=$books[[Math]::Min([int]$entry.bookIndex,$books.Count-1)].id};$json=$record|ConvertTo-Json -Depth 8 -Compress;Invoke-RestMethod -Uri "$ApiBaseUrl/content/manage/$($entry.kind)" -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($json))|Out-Null;$existing[$entry.slug]=$true;$added++}
[pscustomobject]@{Added=$added;Skipped=$skipped;CreatedSales=0}|ConvertTo-Json
