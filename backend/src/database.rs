use surrealdb::{Surreal, engine::local::Mem};
use anyhow::Result;

pub type Database = Surreal<surrealdb::engine::local::Db>;

pub async fn init_database() -> Result<Database> {
    // Initialize in-memory database for development
    let db = Surreal::new::<Mem>(()).await?;
    
    // Use namespace and database
    db.use_ns("infraaid").use_db("main").await?;
    
    // Initialize schema and sample data
    init_schema(&db).await?;
    
    Ok(db)
}

async fn init_schema(db: &Database) -> Result<()> {
    // Initialize hardware basket schema
    init_hardware_basket_schema(db).await?;
    
    // Create sample user
    let _user: Vec<crate::models::User> = db.create("user")
        .content(crate::models::User {
            id: None,
            username: "admin".to_string(),
            email: "admin@company.com".to_string(),
            ad_guid: "sample-guid-123".to_string(),
            role: "admin".to_string(),
        })
        .await?;
    
    // Create sample project
    let _project = db.query("CREATE project SET name = $name, description = $description, owner_id = $owner_id")
        .bind(("name", "Sample Infrastructure Project"))
        .bind(("description", "A demo project for InfraAID system"))
        .bind(("owner_id", surrealdb::sql::Thing::from(("user", "admin"))))
        .await?;
    
    // Create sample hardware vendors
    init_sample_vendors(db).await?;
    
    println!("✅ Database schema initialized with sample data");
    Ok(())
}

async fn init_hardware_basket_schema(db: &Database) -> Result<()> {
    // Define hardware basket tables
    let schema_queries = vec![
        // Hardware Vendors table
        "DEFINE TABLE hardware_vendors SCHEMAFULL;",
        "DEFINE FIELD name ON hardware_vendors TYPE string ASSERT $value != NONE;",
        "DEFINE FIELD contact_info ON hardware_vendors TYPE option<string>;",
        "DEFINE FIELD support_info ON hardware_vendors TYPE option<string>;",
        "DEFINE FIELD created_at ON hardware_vendors TYPE datetime DEFAULT time::now();",
        "DEFINE FIELD updated_at ON hardware_vendors TYPE datetime DEFAULT time::now();",
        "DEFINE INDEX vendor_name ON hardware_vendors COLUMNS name UNIQUE;",
        
        // Hardware Baskets table
        "DEFINE TABLE hardware_baskets SCHEMAFULL;",
        "DEFINE FIELD name ON hardware_baskets TYPE string ASSERT $value != NONE;",
        "DEFINE FIELD vendor_id ON hardware_baskets TYPE record(hardware_vendors);",
        "DEFINE FIELD quarter ON hardware_baskets TYPE string;",
        "DEFINE FIELD year ON hardware_baskets TYPE int;",
        "DEFINE FIELD import_date ON hardware_baskets TYPE datetime DEFAULT time::now();",
        "DEFINE FIELD file_path ON hardware_baskets TYPE string;",
        "DEFINE FIELD exchange_rate ON hardware_baskets TYPE option<float>;",
        "DEFINE FIELD currency_from ON hardware_baskets TYPE string;",
        "DEFINE FIELD currency_to ON hardware_baskets TYPE string;",
        "DEFINE FIELD validity_date ON hardware_baskets TYPE option<datetime>;",
        "DEFINE FIELD created_at ON hardware_baskets TYPE datetime DEFAULT time::now();",
        
        // Hardware Models table
        "DEFINE TABLE hardware_models SCHEMAFULL;",
        "DEFINE FIELD basket_id ON hardware_models TYPE record(hardware_baskets);",
        "DEFINE FIELD vendor_id ON hardware_models TYPE record(hardware_vendors);",
        "DEFINE FIELD lot_description ON hardware_models TYPE string;",
        "DEFINE FIELD model_name ON hardware_models TYPE string;",
        "DEFINE FIELD model_number ON hardware_models TYPE option<string>;",
        "DEFINE FIELD form_factor ON hardware_models TYPE option<string>;",
        "DEFINE FIELD category ON hardware_models TYPE string;",
        "DEFINE FIELD base_specifications ON hardware_models TYPE object;",
        "DEFINE FIELD created_at ON hardware_models TYPE datetime DEFAULT time::now();",
        "DEFINE FIELD updated_at ON hardware_models TYPE datetime DEFAULT time::now();",
        
        // Hardware Configurations table
        "DEFINE TABLE hardware_configurations SCHEMAFULL;",
        "DEFINE FIELD model_id ON hardware_configurations TYPE record(hardware_models);",
        "DEFINE FIELD part_number ON hardware_configurations TYPE option<string>;",
        "DEFINE FIELD sku ON hardware_configurations TYPE option<string>;",
        "DEFINE FIELD description ON hardware_configurations TYPE string;",
        "DEFINE FIELD item_type ON hardware_configurations TYPE string;",
        "DEFINE FIELD quantity ON hardware_configurations TYPE int DEFAULT 1;",
        "DEFINE FIELD specifications ON hardware_configurations TYPE option<object>;",
        "DEFINE FIELD compatibility_notes ON hardware_configurations TYPE option<string>;",
        "DEFINE FIELD created_at ON hardware_configurations TYPE datetime DEFAULT time::now();",
        
        // Hardware Pricing table
        "DEFINE TABLE hardware_pricing SCHEMAFULL;",
        "DEFINE FIELD configuration_id ON hardware_pricing TYPE option<record(hardware_configurations)>;",
        "DEFINE FIELD model_id ON hardware_pricing TYPE option<record(hardware_models)>;",
        "DEFINE FIELD list_price ON hardware_pricing TYPE float;",
        "DEFINE FIELD net_price_usd ON hardware_pricing TYPE float;",
        "DEFINE FIELD net_price_eur ON hardware_pricing TYPE option<float>;",
        "DEFINE FIELD currency ON hardware_pricing TYPE string;",
        "DEFINE FIELD valid_from ON hardware_pricing TYPE datetime;",
        "DEFINE FIELD valid_to ON hardware_pricing TYPE option<datetime>;",
        "DEFINE FIELD support_options ON hardware_pricing TYPE array<object>;",
        "DEFINE FIELD created_at ON hardware_pricing TYPE datetime DEFAULT time::now();",
        
        // Country Support table
        "DEFINE TABLE country_support SCHEMAFULL;",
        "DEFINE FIELD vendor_id ON country_support TYPE record(hardware_vendors);",
        "DEFINE FIELD country ON country_support TYPE string;",
        "DEFINE FIELD region ON country_support TYPE option<string>;",
        "DEFINE FIELD fulfillment_capability ON country_support TYPE string;",
        "DEFINE FIELD web_ordering ON country_support TYPE bool;",
        "DEFINE FIELD delivery_terms ON country_support TYPE string;",
        "DEFINE FIELD delivery_time_days ON country_support TYPE option<int>;",
        "DEFINE FIELD import_duties ON country_support TYPE option<string>;",
        "DEFINE FIELD vat_rates ON country_support TYPE option<string>;",
        "DEFINE FIELD freight_costs ON country_support TYPE option<string>;",
        "DEFINE FIELD affiliate_info ON country_support TYPE option<string>;",
        "DEFINE FIELD created_at ON country_support TYPE datetime DEFAULT time::now();",
        
        // Exchange Rates table
        "DEFINE TABLE exchange_rates SCHEMAFULL;",
        "DEFINE FIELD from_currency ON exchange_rates TYPE string;",
        "DEFINE FIELD to_currency ON exchange_rates TYPE string;",
        "DEFINE FIELD rate ON exchange_rates TYPE float;",
        "DEFINE FIELD effective_date ON exchange_rates TYPE datetime;",
        "DEFINE FIELD expiry_date ON exchange_rates TYPE option<datetime>;",
        "DEFINE FIELD source ON exchange_rates TYPE string;",
        "DEFINE FIELD created_at ON exchange_rates TYPE datetime DEFAULT time::now();",
        
        // Import Results table
        "DEFINE TABLE import_results SCHEMAFULL;",
        "DEFINE FIELD basket_id ON import_results TYPE record(hardware_baskets);",
        "DEFINE FIELD status ON import_results TYPE string;",
        "DEFINE FIELD total_models ON import_results TYPE int;",
        "DEFINE FIELD processed_models ON import_results TYPE int;",
        "DEFINE FIELD total_configurations ON import_results TYPE int;",
        "DEFINE FIELD processed_configurations ON import_results TYPE int;",
        "DEFINE FIELD errors ON import_results TYPE array<object>;",
        "DEFINE FIELD warnings ON import_results TYPE array<object>;",
        "DEFINE FIELD started_at ON import_results TYPE datetime;",
        "DEFINE FIELD completed_at ON import_results TYPE option<datetime>;",
    ];
    
    for query in schema_queries {
        db.query(query).await?;
    }
    
    println!("✅ Hardware basket schema defined");
    Ok(())
}

async fn init_sample_vendors(db: &Database) -> Result<()> {
    use surrealdb::sql::Datetime;
    
    // Create Dell vendor
    let _dell = db.query("CREATE hardware_vendors SET name = $name, contact_info = $contact_info, support_info = $support_info")
        .bind(("name", "Dell"))
        .bind(("contact_info", "Dell Technologies Inc."))
        .bind(("support_info", "Dell ProSupport services available"))
        .await?;
    
    // Create Lenovo vendor
    let _lenovo = db.query("CREATE hardware_vendors SET name = $name, contact_info = $contact_info, support_info = $support_info")
        .bind(("name", "Lenovo"))
        .bind(("contact_info", "Lenovo Global Technology"))
        .bind(("support_info", "ThinkSystem support services available"))
        .await?;
    
    println!("✅ Sample hardware vendors created");
    Ok(())
}
