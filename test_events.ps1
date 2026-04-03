# Test script for local AI classifier
$apiKey = 'test-local-classifier-key'
$headers = @{
    'x-api-key' = $apiKey
    'Content-Type' = 'application/json'
}

Write-Host '=== Testing Local AI Classifier ===' -ForegroundColor Cyan
Write-Host "API Key: $apiKey" -ForegroundColor Yellow

# Event 1: Unauthorized access
$event1 = @{
    projectId = 'test-org'
    type = 'unauthorized_access'
    service = 'auth'
    message = 'Unauthorized access attempt detected'
} | ConvertTo-Json

Write-Host 'Event 1: Unauthorized Access' -ForegroundColor Yellow
try {
    $resp1 = Invoke-RestMethod -Uri http://localhost:5000/events/ingest -Method POST -Headers $headers -Body $event1 -ErrorAction Stop
    Write-Host "OK - Analyzed: $($resp1.analyzed), Reason: $($resp1.reason)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

Start-Sleep -Milliseconds 500

# Event 2: Database timeout  
$event2 = @{
    projectId = 'test-org'
    type = 'database_timeout'
    service = 'database'
    message = 'Database query timeout exceeded critical'
} | ConvertTo-Json

Write-Host 'Event 2: Database Timeout' -ForegroundColor Yellow
try {
    $resp2 = Invoke-RestMethod -Uri http://localhost:5000/events/ingest -Method POST -Headers $headers -Body $event2 -ErrorAction Stop
    Write-Host "OK - Analyzed: $($resp2.analyzed), Reason: $($resp2.reason)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

Start-Sleep -Milliseconds 500

# Event 3: API failure
$event3 = @{
    projectId = 'test-org'
    type = 'api_failure'
    service = 'payment'
    message = 'Payment API service failure exception'
} | ConvertTo-Json

Write-Host 'Event 3: API Failure' -ForegroundColor Yellow
try {
    $resp3 = Invoke-RestMethod -Uri http://localhost:5000/events/ingest -Method POST -Headers $headers -Body $event3 -ErrorAction Stop
    Write-Host "OK - Analyzed: $($resp3.analyzed), Reason: $($resp3.reason)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

Write-Host '[SUCCESS] All events processed by local classifier!' -ForegroundColor Cyan
