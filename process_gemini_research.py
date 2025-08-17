#!/usr/bin/env python3
"""
Server Specification Database Population Script
Processes Gemini research results and updates the LCMDesigner database
"""

import json
import requests
import sys
from typing import Dict, List, Any
from pathlib import Path

# Backend API configuration
BACKEND_URL = "http://127.0.0.1:3001"
API_HEADERS = {
    "Content-Type": "application/json",
    "x-user-id": "admin"
}

class ServerSpecProcessor:
    def __init__(self, backend_url: str = BACKEND_URL):
        self.backend_url = backend_url
        
    def load_gemini_research(self, file_path: str) -> Dict[str, Any]:
        """Load Gemini research results from JSON file"""
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def transform_to_surreal_spec(self, gemini_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Gemini research format to SurrealDB specification format"""
        
        # Extract processor information
        processor_spec = None
        if 'processor' in gemini_spec:
            proc = gemini_spec['processor']
            processor_spec = {
                "socket_count": proc.get('socket_count'),
                "socket_type": proc.get('socket_type'),
                "max_cores_per_socket": proc.get('max_cores_per_socket'),
                "max_threads_per_socket": proc.get('max_threads_per_socket'),
                "tdp_range": proc.get('tdp_range'),
                "supported_families": proc.get('supported_families', [])
            }
            
            # Add example processor details if available
            if 'example_processors' in proc and proc['example_processors']:
                example = proc['example_processors'][0]
                processor_spec.update({
                    "model": example.get('model'),
                    "core_count": example.get('cores'),
                    "thread_count": example.get('threads'),
                    "frequency_ghz": self.parse_frequency(example.get('frequency')),
                    "tdp": example.get('tdp')
                })
        
        # Extract memory information
        memory_spec = None
        if 'memory' in gemini_spec:
            mem = gemini_spec['memory']
            memory_spec = {
                "max_capacity": mem.get('max_capacity'),
                "slots": mem.get('slots'),
                "types": mem.get('types', []),
                "speeds_supported": [f"{speed} MT/s" for speed in mem.get('speeds', [])],
                "ecc": mem.get('ecc', True),
                "example_configs": mem.get('example_configs', [])
            }
            
            # Estimate current capacity based on example configs
            if mem.get('example_configs'):
                example = mem['example_configs'][0]
                if 'GB' in example:
                    capacity_match = example.split('GB')[0].split()[-1]
                    try:
                        memory_spec["total_capacity"] = f"{int(capacity_match) * mem.get('slots', 1)}GB"
                    except:
                        memory_spec["total_capacity"] = mem.get('max_capacity')
        
        # Extract storage information
        storage_spec = None
        if 'storage' in gemini_spec:
            stor = gemini_spec['storage']
            storage_spec = {
                "front_bays": {
                    "count": stor.get('front_bays', {}).get('count'),
                    "size": stor.get('front_bays', {}).get('size'),
                    "interfaces": stor.get('front_bays', {}).get('interfaces', [])
                },
                "rear_bays": {
                    "count": stor.get('rear_bays', {}).get('count', 0),
                    "size": stor.get('rear_bays', {}).get('size'),
                    "interfaces": stor.get('rear_bays', {}).get('interfaces', [])
                },
                "internal_m2": stor.get('internal_m2', 0),
                "raid_support": stor.get('raid_support', []),
                "max_capacity": stor.get('max_capacity')
            }
        
        # Extract network information
        network_spec = None
        if 'network' in gemini_spec:
            net = gemini_spec['network']
            network_spec = {
                "onboard_ports": net.get('onboard_description'),
                "pcie_slots": net.get('expansion_slots'),
                "management": net.get('management'),
                "ports": []
            }
            
            # Parse onboard ports into structured format
            if net.get('onboard_ports'):
                for port in net['onboard_ports']:
                    network_spec["ports"].append({
                        "count": port.get('count', 1),
                        "speed": port.get('speed'),
                        "type": port.get('type')
                    })
        
        # Extract physical specifications
        physical_spec = None
        if 'physical' in gemini_spec:
            phys = gemini_spec['physical']
            physical_spec = {
                "form_factor": phys.get('form_factor'),
                "dimensions": {
                    "height": phys.get('height'),
                    "width": phys.get('width'),
                    "depth": phys.get('depth')
                },
                "weight_range": phys.get('weight_range'),
                "rack_units": phys.get('rack_units')
            }
        
        # Extract power specifications
        power_spec = None
        if 'power' in gemini_spec:
            pow_spec = gemini_spec['power']
            power_spec = {
                "psu_options": pow_spec.get('psu_options', []),
                "redundancy": pow_spec.get('redundancy'),
                "efficiency": pow_spec.get('efficiency'),
                "typical_consumption": pow_spec.get('typical_consumption'),
                "max_consumption": pow_spec.get('max_consumption')
            }
        
        # Extract expansion specifications
        expansion_spec = None
        if 'expansion' in gemini_spec:
            exp = gemini_spec['expansion']
            expansion_spec = {
                "pcie_slots": exp.get('pcie_slots'),
                "slot_details": exp.get('slot_details', []),
                "io_ports": exp.get('io_ports', {}),
                "expansion_capacity": exp.get('expansion_capacity')
            }
        
        # Build complete specification object
        complete_spec = {
            "processor": processor_spec,
            "memory": memory_spec,
            "storage": storage_spec,
            "network": network_spec,
            "physical": physical_spec,
            "power": power_spec,
            "expansion": expansion_spec,
            "security": gemini_spec.get('security'),
            "management": gemini_spec.get('management')
        }
        
        # Remove None values
        return {k: v for k, v in complete_spec.items() if v is not None}
    
    def parse_frequency(self, freq_str: str) -> float:
        """Parse frequency string like '2.5GHz' to float"""
        if not freq_str:
            return None
        try:
            return float(freq_str.replace('GHz', '').strip())
        except:
            return None
    
    def find_matching_models(self, model_name: str, vendor: str) -> List[Dict[str, Any]]:
        """Find database models that match the Gemini research model"""
        try:
            # Get all baskets for the vendor
            response = requests.get(f"{self.backend_url}/api/hardware-baskets")
            baskets = response.json()
            
            vendor_baskets = [b for b in baskets if b.get('vendor') == vendor]
            matching_models = []
            
            for basket in vendor_baskets:
                basket_id = basket['id']['id']['String']
                models_response = requests.get(f"{self.backend_url}/api/hardware-baskets/{basket_id}/models")
                models = models_response.json()
                
                # Find models that contain the model name
                for model in models:
                    if model_name.replace(' ', '').lower() in model.get('model_name', '').replace(' ', '').lower():
                        matching_models.append({
                            'id': model['id']['id']['String'],
                            'model_name': model.get('model_name'),
                            'current_specs': model.get('base_specifications')
                        })
            
            return matching_models
            
        except Exception as e:
            print(f"Error finding matching models: {e}")
            return []
    
    def update_model_specifications(self, model_id: str, specifications: Dict[str, Any]) -> bool:
        """Update model specifications via backend API (when endpoint exists)"""
        # This would be implemented once we add the PUT endpoint to the backend
        print(f"Would update model {model_id} with specifications:")
        print(json.dumps(specifications, indent=2))
        return True
    
    def process_research_file(self, research_file: str) -> Dict[str, Any]:
        """Process complete Gemini research file and update database"""
        research_data = self.load_gemini_research(research_file)
        results = {
            "processed": 0,
            "updated": 0,
            "errors": [],
            "matches": []
        }
        
        for server_model in research_data.get('servers', []):
            try:
                model_name = server_model.get('model_name')
                vendor = server_model.get('vendor')
                
                print(f"\nProcessing {vendor} {model_name}...")
                
                # Transform Gemini format to our database format
                db_spec = self.transform_to_surreal_spec(server_model)
                
                # Find matching models in database
                matching_models = self.find_matching_models(model_name, vendor)
                
                print(f"Found {len(matching_models)} matching models")
                
                for match in matching_models:
                    print(f"  - {match['model_name']} (ID: {match['id']})")
                    results['matches'].append({
                        'research_model': model_name,
                        'db_model': match['model_name'],
                        'db_id': match['id'],
                        'enhanced_spec': db_spec
                    })
                    
                    # Update specifications (when backend endpoint is ready)
                    if self.update_model_specifications(match['id'], db_spec):
                        results['updated'] += 1
                
                results['processed'] += 1
                
            except Exception as e:
                error_msg = f"Error processing {model_name}: {str(e)}"
                print(f"ERROR: {error_msg}")
                results['errors'].append(error_msg)
        
        return results

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 process_gemini_research.py <research_file.json>")
        sys.exit(1)
    
    research_file = sys.argv[1]
    if not Path(research_file).exists():
        print(f"Error: Research file {research_file} not found")
        sys.exit(1)
    
    processor = ServerSpecProcessor()
    results = processor.process_research_file(research_file)
    
    print(f"\n=== Processing Complete ===")
    print(f"Processed: {results['processed']} server models")
    print(f"Database matches found: {len(results['matches'])}")
    print(f"Models updated: {results['updated']}")
    
    if results['errors']:
        print(f"\nErrors encountered: {len(results['errors'])}")
        for error in results['errors']:
            print(f"  - {error}")
    
    # Save detailed results
    with open('processing_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nDetailed results saved to processing_results.json")

if __name__ == "__main__":
    main()
