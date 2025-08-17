use core_engine::hardware_parser::spec_parser::SpecParser;

#[test]
fn test_processor_thread_and_freq_parsing() {
    let parser = SpecParser::new();

    let examples = vec![
        ("Intel Xeon Silver 4410T 10C 150W 2.7GHz Processor", Some((10, None, Some(2.7)))),
        ("Intel Xeon Gold 6426Y 16C 185W 2.5GHz", Some((16, None, Some(2.5)))),
        ("Xeon Platinum 8462Y+ 32C 300W 2.8GHz", Some((32, None, Some(2.8)))),
        ("CPU 8C/16T 2.9GHz", Some((8, Some(16), Some(2.9)))),
        ("AMD EPYC 16C/32T 2.65GHz", Some((16, Some(32), Some(2.65)))),
    ];

    for (text, expected) in examples {
        let spec = parser.parse_processor(text).expect("should parse");
        if let Some((exp_cores, exp_threads, exp_freq)) = expected {
            assert_eq!(spec.core_count, Some(exp_cores));
            if exp_threads.is_some() {
                assert_eq!(spec.thread_count, exp_threads);
            }
            if let Some(f) = exp_freq {
                let got = spec.frequency_ghz.expect("frequency present");
                assert!((got - f).abs() < 0.01, "freq mismatch {} vs {}", got, f);
            }
        }
    }
}

#[test]
fn integration_lenovo_parse_sample() {
    let manifest_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    let path = manifest_dir.join("..").join("docs").join("X86 Basket Q3 2025 v2 Lenovo Only.xlsx");
    assert!(path.exists(), "sample workbook missing at {:?}", path);

    let parser = core_engine::hardware_parser::HardwareBasketParser;
    let res = parser.parse_file(path.to_str().unwrap());
    assert!(res.is_ok(), "parsing failed: {:?}", res.err());
    let parsed = res.unwrap();
    println!("Parsed: lots={}, components={}, options={}", parsed.hardware_lots.len(), parsed.hardware_components.len(), parsed.hardware_options.len());
}
