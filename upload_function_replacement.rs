async fn upload_hardware_basket_simple(
    State(db): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, StatusCode> {
    println!("🔍 Received simple hardware basket upload request");
    
    let mut vendor: Option<String> = None;
    let mut file_data: Option<Vec<u8>> = None;
    let mut file_name: Option<String> = None;

    // Process multipart form
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        eprintln!("Error reading multipart field: {:?}", e);
        StatusCode::BAD_REQUEST
    })? {
        let field_name = field.name().unwrap_or("").to_string();
        
        match field_name.as_str() {
            "vendor" => {
                vendor = Some(field.text().await.map_err(|e| {
                    eprintln!("Error reading vendor field: {:?}", e);
                    StatusCode::BAD_REQUEST
                })?);
            }
            "file" => {
                file_name = field.file_name().map(|s| s.to_string());
                file_data = Some(field.bytes().await.map_err(|e| {
                    eprintln!("Error reading file data: {:?}", e);
                    StatusCode::BAD_REQUEST
                })?.to_vec());
            }
            _ => {
                // Ignore unknown fields
            }
        }
    }

    let vendor = vendor.unwrap_or_else(|| "unknown".to_string());
    let file_name = file_name.unwrap_or_else(|| "uploaded_file.xlsx".to_string());
    
    if file_data.is_none() {
        eprintln!("No file uploaded in multipart request");
        return Err(StatusCode::BAD_REQUEST);
    }

    // Save file to temporary location
    let mut temp_file = NamedTempFile::new().map_err(|e| {
        eprintln!("Error creating temp file: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    temp_file.write_all(&file_data.unwrap()).map_err(|e| {
        eprintln!("Error writing to temp file: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    println!("🔍 Parsing {} file: {} using vendor: {}", 
             temp_file.path().extension().unwrap_or_default().to_string_lossy(),
             file_name, 
             vendor);

    // Parse the file using legacy method and transform to schema format
    let parser = HardwareBasketParser;
    match parser.parse_file(temp_file.path().to_str().unwrap()) {
        Ok(parsed) => {
            println!("✅ Successfully parsed hardware basket:");
            println!("   📊 Hardware lots: {}", parsed.hardware_lots.len());
            println!("   🔧 Hardware options: {}", parsed.hardware_options.len());
            
            // Transform legacy data to schema-like format for testing
            let mut server_lots = Vec::new();
            let mut component_options = Vec::new();
            
            // Group options by likely server platforms to create mock server configurations
            use std::collections::HashMap;
            let mut server_groups: HashMap<String, Vec<_>> = HashMap::new();
            
            for option in &parsed.hardware_options {
                let platform_key = if option.description.contains("SR630") {
                    "ThinkSystem SR630".to_string()
                } else if option.description.contains("SR645") {
                    "ThinkSystem SR645".to_string()
                } else if option.description.contains("SR650") {
                    "ThinkSystem SR650".to_string()
                } else if option.description.contains("SR665") {
                    "ThinkSystem SR665".to_string()
                } else if option.description.contains("ThinkSystem") || option.description.contains("Lenovo") {
                    "ThinkSystem Server".to_string()
                } else {
                    "Components".to_string()
                };
                
                server_groups.entry(platform_key).or_insert_with(Vec::new).push(option);
            }
            
            // Create server configurations from grouped options
            for (platform, options) in server_groups {
                if platform != "Components" && !options.is_empty() {
                    // Create a server configuration from the first option in each group
                    let base_option = options[0];
                    server_lots.push(serde_json::json!({
                        "vendor": "Lenovo",
                        "lot_description": format!("Lenovo {} Server Configuration", platform),
                        "form_factor": "2U Rack",
                        "model": platform.clone(),
                        "platform": platform,
                        "description": format!("Complete {} server with {} components", platform, options.len()),
                        "specifications": {
                            "cpu_count": 1,
                            "memory_slots": 16,
                            "drive_bays": 8,
                            "form_factor": "2U Rack"
                        },
                        "unit_price_usd": base_option.unit_price_usd
                    }));
                } else {
                    // Add remaining items as components
                    for option in options {
                        component_options.push(serde_json::json!({
                            "vendor": option.vendor,
                            "description": option.description,
                            "category": "Component",
                            "subcategory": "Hardware",
                            "specifications": {
                                "part_number": option.part_number.as_deref().unwrap_or("N/A"),
                                "form_factor": option.form_factor.as_deref().unwrap_or("N/A")
                            },
                            "unit_price_usd": option.unit_price_usd
                        }));
                    }
                }
            }
            
            println!("✅ Transformed to schema format:");
            println!("   🖥️  Server configurations: {}", server_lots.len());
            println!("   🔧 Component options: {}", component_options.len());

            Ok(Json(serde_json::json!({
                "message": "File parsed successfully",
                "vendor": vendor,
                "filename": file_name,
                "hardware_lots": server_lots.len(),
                "hardware_options": component_options.len(),
                "processing_errors": parsed.processing_errors,
                "success": true,
                "servers": server_lots,
                "components": component_options
            })))
        }
        Err(e) => {
            eprintln!("❌ Error parsing hardware basket file: {:?}", e);
            Ok(Json(serde_json::json!({
                "message": format!("Error parsing file: {}", e),
                "vendor": vendor,
                "filename": file_name,
                "success": false
            })))
        }
    }
}
