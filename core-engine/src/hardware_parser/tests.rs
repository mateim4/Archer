use super::*;
use std::path::PathBuf;

#[test]
fn test_parse_dell_scp_file() {
    let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    d.push("src/hardware_parser/tests/sample_dell.xml");

    let parser = UniversalParser;
    let result = parser.parse_file(d.to_str().unwrap());

    assert!(result.is_ok());
    let server = result.unwrap();

    assert_eq!(server.vendor, "Dell");
    assert_eq!(server.model_name.unwrap(), "PowerEdge R740");
    assert_eq!(server.serial_number.unwrap(), "G1FWHQ2");

    // Check iDRAC details
    let idrac = server.management.unwrap();
    assert_eq!(idrac.dns_name.unwrap(), "idrac-g1fwhq2");
}

#[test]
fn test_parse_lenovo_dcsc_file() {
    let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    d.push("src/hardware_parser/tests/sample_lenovo.xml");

    let parser = UniversalParser;
    let result = parser.parse_file(d.to_str().unwrap());

    assert!(result.is_ok());
    let server = result.unwrap();

    assert_eq!(server.vendor, "Lenovo");
    assert_eq!(server.model_name.unwrap(), "ThinkSystem SR650");
    assert_eq!(server.serial_number.unwrap(), "J1234567");
    assert_eq!(server.cpus.len(), 2);
    assert_eq!(server.cpus[0].core_count.unwrap(), 24);
    assert_eq!(server.memory.len(), 2);
    assert_eq!(server.memory[0].capacity_gb.unwrap(), 32);
    assert_eq!(server.storage_controllers.len(), 1);
    assert_eq!(server.storage_controllers[0].model.as_ref().unwrap(), "RAID 930-8i");
}

#[test]
fn test_hpe_parser_stub() {
    use std::fs::File;
    use std::io::Write;

    let dummy_file_path = "dummy_hpe.txt";
    let mut dummy_file = File::create(dummy_file_path).unwrap();
    writeln!(dummy_file, "iQuote").unwrap();

    let parser = UniversalParser;
    let result = parser.parse_file(dummy_file_path);

    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(matches!(error, CoreEngineError::NotImplemented(_)));

    // Clean up the dummy file
    std::fs::remove_file(dummy_file_path).unwrap();
}
