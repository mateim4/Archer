use core_engine::parser::RvToolsParser;
use serde_json;
use std::env;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() != 2 {
        eprintln!("Usage: {} <rvtools_file_path>", args[0]);
        process::exit(1);
    }
    
    let file_path = &args[1];
    
    match RvToolsParser::new(file_path).and_then(|mut parser| parser.parse()) {
        Ok(environment) => {
            match serde_json::to_string_pretty(&environment) {
                Ok(json) => println!("{}", json),
                Err(e) => {
                    eprintln!("Error serializing to JSON: {}", e);
                    process::exit(1);
                }
            }
        },
        Err(e) => {
            eprintln!("Error parsing RVTools file: {}", e);
            process::exit(1);
        }
    }
}
