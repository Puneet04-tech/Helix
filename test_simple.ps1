$apiKey = "test-local-classifier-key"
$headers = @{
    'x-api-key' = $apiKey
    'Content-Type' = 'application/json'
}

# Event 1: Unauthorized access
$event1 = @{
    projectId = 'test-org'
    type = 'unauthorized_access'
    service = 'auth'
    message = 'Unauthorized access attempt detected from suspicious IP'
} | ConvertTo-Json

Write-Host "Testing with API Key: $apiKey" -ForegroundColor Yellow
Write-Host "Sending Event 1..."
try {
    $resp = Invoke-RestMethod -Uri http://localhost:5000/events/ingest -Method POST -Headers $headers -Body $event1 -ErrorAction Stop
    Write-Host "Response:" -ForegroundColor Green
    $resp | ConvertTo-Json
} catch {
    Write-Host "Error:" $_
}
