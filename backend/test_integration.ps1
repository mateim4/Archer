$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    provider_type = "NutanixPrism"
    config = @{
        id = "test-nutanix"
        name = "Test Nutanix"
        provider_type = "NutanixPrism"
        base_url = "https://prism.local"
        auth_token = "test-token"
        poll_interval_seconds = 300
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/integration/scan" -Method Post -Headers $headers -Body $body
    Write-Host "Response received:"
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
