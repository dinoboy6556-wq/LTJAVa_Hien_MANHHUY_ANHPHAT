param(
    [string]$ApiBaseUrl = 'http://localhost:8080/api/v1',
    [string]$AdminEmail = 'admin@library.com',
    [System.Security.SecureString]$AdminPassword
)
$ErrorActionPreference = 'Stop'
if (-not $AdminPassword) { $AdminPassword = Read-Host 'Mật khẩu quản trị (không lưu vào file)' -AsSecureString }
$credential = [System.Management.Automation.PSCredential]::new($AdminEmail, $AdminPassword)
$loginBody = @{email=$AdminEmail;password=$credential.GetNetworkCredential().Password} | ConvertTo-Json -Compress
$login = Invoke-RestMethod -Uri "$ApiBaseUrl/auth/login" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($loginBody))
$loginBody = $null
$headers = @{Authorization="Bearer $($login.token)"}
function Read-Records([string]$Resource) { foreach ($row in (Invoke-RestMethod -Uri "$ApiBaseUrl/$Resource" -Headers $headers)) { $row } }
function Add-Record([string]$Resource, $Record) {
    $body = $Record | ConvertTo-Json -Depth 10 -Compress
    Invoke-RestMethod -Uri "$ApiBaseUrl/$Resource" -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
}
$sample = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'sample_catalog_20.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$maps = @{}
$created = [ordered]@{}
foreach ($resource in @('categories','authors','publishers')) {
    $lookup = @{}
    foreach ($record in (Read-Records $resource)) { $lookup[$record.name] = $record.id }
    $created[$resource] = 0
    foreach ($record in $sample.$resource) {
        if (-not $lookup.ContainsKey($record.name)) {
            $saved = Add-Record $resource $record
            $lookup[$record.name] = $saved.id
            $created[$resource]++
        }
    }
    $maps[$resource] = $lookup
}
$existing = @{}
foreach ($book in (Read-Records 'books')) { if ($book.isbn) { $existing[$book.isbn] = $book.id } }
$created.books = 0
foreach ($book in $sample.books) {
    if ($existing.ContainsKey($book.isbn)) { continue }
    $body = @{title=$book.title;isbn=$book.isbn;coverImageUrl=$book.coverImageUrl;description=$book.description;categoryId=$maps.categories[$book.category];authorId=$maps.authors[$book.author];publisherId=$maps.publishers[$book.publisher];totalQuantity=$book.totalQuantity;rentalPrice=$book.rentalPrice;salePrice=$book.salePrice}
    $saved = Add-Record 'books' $body
    $existing[$book.isbn] = $saved.id
    $created.books++
}
$totals = [ordered]@{}
foreach ($resource in @('books','categories','authors','publishers')) { $totals[$resource] = @(Read-Records $resource).Count }
[pscustomobject]@{Created=[pscustomobject]$created;Totals=[pscustomobject]$totals} | ConvertTo-Json -Depth 5
