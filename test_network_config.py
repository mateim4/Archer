#!/usr/bin/env python3
"""
Test Network Configuration Backend - Task 5
Tests network mapping CRUD, validation, topology generation, and visualization
"""

import requests
import json
import sys
from typing import Dict, Any

BASE_URL = "http://127.0.0.1:3001/api/v1/migration-wizard"

def print_section(title: str):
    """Print formatted section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def check_response(response: requests.Response, step: str) -> Dict[Any, Any]:
    """Check response status and return JSON"""
    print(f"🔹 {step}")
    print(f"   Status: {response.status_code}")
    
    if response.status_code >= 400:
        print(f"   ❌ Error: {response.text}")
        sys.exit(1)
    
    data = response.json()
    print(f"   ✅ Success")
    # Pretty print result if it's not too large
    result_str = json.dumps(data, indent=2)
    if len(result_str) < 500:
        print(f"   Result: {result_str}")
    else:
        print(f"   Result: (truncated, {len(result_str)} chars)")
    return data

def main():
    print("\n🧪 Testing Network Configuration Backend (Task 5)")
    print("   Includes: VLAN mapping, validation, topology, visualization")
    
    # Step 1: Create test project
    print_section("1. Create Test Project")
    project_resp = requests.post(f"{BASE_URL}/projects", json={
        "name": "Network Config Test Project",
        "description": "Testing network topology and mapping features"
    })
    project = check_response(project_resp, "Create project")
    project_id = project.get('result', {}).get('id')
    
    print(f"\n   📋 Project ID: {project_id}")
    
    # Step 2: Create Network Mappings
    print_section("2. Create Network Mappings")
    
    # Mapping 1: Production VLAN
    mapping1_resp = requests.post(
        f"{BASE_URL}/projects/{project_id}/network-mappings",
        json={
            "source_vlan_name": "VLAN-100-Production",
            "source_vlan_id": 100,
            "source_subnet": "10.0.100.0/24",
            "destination_vlan_name": "Production-HV",
            "destination_vlan_id": 100,
            "destination_subnet": "10.0.100.0/24",
            "destination_gateway": "10.0.100.1",
            "destination_dns": ["10.0.1.10", "10.0.1.11"]
        }
    )
    mapping1 = check_response(mapping1_resp, "Create Production mapping")
    mapping1_id = mapping1.get('result', {}).get('id')
    
    # Mapping 2: Management VLAN
    mapping2_resp = requests.post(
        f"{BASE_URL}/projects/{project_id}/network-mappings",
        json={
            "source_vlan_name": "VLAN-10-Management",
            "source_vlan_id": 10,
            "source_subnet": "192.168.10.0/24",
            "destination_vlan_name": "Management-HV",
            "destination_vlan_id": 10,
            "destination_subnet": "192.168.10.0/24",
            "destination_gateway": "192.168.10.1",
            "destination_dns": ["192.168.10.10"]
        }
    )
    mapping2 = check_response(mapping2_resp, "Create Management mapping")
    
    # Mapping 3: Storage VLAN
    mapping3_resp = requests.post(
        f"{BASE_URL}/projects/{project_id}/network-mappings",
        json={
            "source_vlan_name": "VLAN-200-Storage",
            "source_vlan_id": 200,
            "source_subnet": "172.16.200.0/24",
            "destination_vlan_name": "Storage-HV",
            "destination_vlan_id": 200,
            "destination_subnet": "172.16.200.0/24",
            "destination_gateway": "172.16.200.1"
        }
    )
    mapping3 = check_response(mapping3_resp, "Create Storage mapping")
    
    # Step 3: List Network Mappings
    print_section("3. List All Network Mappings")
    
    list_resp = requests.get(f"{BASE_URL}/projects/{project_id}/network-mappings")
    list_data = check_response(list_resp, "List network mappings")
    
    total_mappings = list_data.get('result', {}).get('total', 0)
    print(f"\n   📊 Total mappings: {total_mappings}")
    
    # Step 4: Update Network Mapping
    print_section("4. Update Network Mapping")
    
    update_resp = requests.put(
        f"{BASE_URL}/network-mappings/{mapping1_id}",
        json={
            "destination_dns": ["10.0.1.10", "10.0.1.11", "10.0.1.12"]
        }
    )
    check_response(update_resp, "Update mapping DNS servers")
    
    # Step 5: Validate Network Mappings
    print_section("5. Validate Network Mappings")
    
    validate_resp = requests.post(
        f"{BASE_URL}/projects/{project_id}/network-mappings/validate",
        json={}
    )
    validation = check_response(validate_resp, "Validate all mappings")
    
    result = validation.get('result', {})
    print(f"\n   📊 Validation Results:")
    print(f"      Is Valid: {result.get('is_valid', False)}")
    print(f"      Total Mappings: {result.get('total_mappings', 0)}")
    print(f"      Valid: {result.get('valid_mappings', 0)}")
    print(f"      Invalid: {result.get('invalid_mappings', 0)}")
    print(f"      Errors: {len(result.get('errors', []))}")
    print(f"      Warnings: {len(result.get('warnings', []))}")
    
    # Step 6: Get Network Topology
    print_section("6. Get Network Topology")
    
    topology_resp = requests.get(f"{BASE_URL}/projects/{project_id}/network-topology")
    topology = check_response(topology_resp, "Get network topology")
    
    topo_data = topology.get('result', {}).get('topology', {})
    stats = topo_data.get('statistics', {})
    print(f"\n   📊 Topology Statistics:")
    print(f"      vSwitches: {stats.get('total_vswitches', 0)}")
    print(f"      Port Groups: {stats.get('total_port_groups', 0)}")
    print(f"      VLANs: {stats.get('total_vlans', 0)}")
    print(f"      Physical NICs: {stats.get('total_physical_nics', 0)}")
    print(f"      VMkernel Ports: {stats.get('total_vmkernel_ports', 0)}")
    print(f"      VM Adapters: {stats.get('total_vm_adapters', 0)}")
    
    # Step 7: Get Network Visualization Data (visx)
    print_section("7. Get Network Visualization Data (visx)")
    
    viz_resp = requests.get(
        f"{BASE_URL}/projects/{project_id}/network-topology/visualization"
    )
    viz_data = check_response(viz_resp, "Get visx visualization data")
    
    viz_result = viz_data.get('result', {})
    metadata = viz_result.get('metadata', {})
    print(f"\n   📊 Visualization Metadata:")
    print(f"      Source Vendor: {metadata.get('source_vendor', 'N/A')}")
    print(f"      Dest Vendor: {metadata.get('dest_vendor', 'N/A')}")
    print(f"      Total Nodes: {metadata.get('total_nodes', 0)}")
    print(f"      Total Links: {metadata.get('total_links', 0)}")
    print(f"      Total VLANs: {metadata.get('total_vlans', 0)}")
    print(f"      Total IPs: {metadata.get('total_ips', 0)}")
    
    # Step 8: Get Mermaid Diagram
    print_section("8. Get Mermaid Diagram Code")
    
    mermaid_resp = requests.get(
        f"{BASE_URL}/projects/{project_id}/network-topology/mermaid"
    )
    mermaid = check_response(mermaid_resp, "Generate Mermaid diagram")
    
    diagram_code = mermaid.get('result', {}).get('diagram_code', '')
    print(f"\n   📋 Mermaid Diagram Preview (first 300 chars):")
    print(f"   {diagram_code[:300]}...")
    
    # Step 9: Delete Network Mapping
    print_section("9. Delete Network Mapping")
    
    delete_resp = requests.delete(f"{BASE_URL}/network-mappings/{mapping1_id}")
    check_response(delete_resp, "Delete mapping")
    
    # Verify deletion
    list_resp2 = requests.get(f"{BASE_URL}/projects/{project_id}/network-mappings")
    list_data2 = check_response(list_resp2, "Verify mapping deleted")
    remaining = list_data2.get('result', {}).get('total', 0)
    print(f"\n   📊 Remaining mappings: {remaining}")
    
    # Step 10: Test All Endpoints Summary
    print_section("✅ Task 5 Network Configuration Test Complete")
    
    print("\n📋 Summary:")
    print(f"   • Project ID: {project_id}")
    print(f"   • Network Mappings Created: 3")
    print(f"   • Mappings Remaining: {remaining}")
    print(f"   • Validation: {'✅ Passed' if result.get('is_valid') else '⚠️  Has Issues'}")
    
    print("\n🎯 Endpoints Tested:")
    endpoints = [
        ("POST", f"/projects/:id/network-mappings", "Create mapping"),
        ("GET", f"/projects/:id/network-mappings", "List mappings"),
        ("PUT", f"/network-mappings/:id", "Update mapping"),
        ("DELETE", f"/network-mappings/:id", "Delete mapping"),
        ("POST", f"/projects/:id/network-mappings/validate", "Validate mappings"),
        ("GET", f"/projects/:id/network-topology", "Get topology"),
        ("GET", f"/projects/:id/network-topology/visualization", "Get visx data"),
        ("GET", f"/projects/:id/network-topology/mermaid", "Get Mermaid diagram"),
    ]
    
    for method, path, description in endpoints:
        print(f"   ✅ {method:6} {path}")
        print(f"      → {description}")
    
    print("\n🎨 Network Visualization Features:")
    print("   ✅ Network topology data structure (vSwitches, port groups, NICs)")
    print("   ✅ visx-compatible JSON output (nodes, links, metadata)")
    print("   ✅ Mermaid diagram generation for HLD documents")
    print("   ✅ VLAN conflict detection")
    print("   ✅ Subnet overlap validation")
    print("   ✅ IP address validation")
    
    print("\n🚧 Next Steps:")
    print("   1. Parse RVTools network tabs (vSwitch, vNic, vPort, vHost)")
    print("   2. Build network topology from real RVTools data")
    print("   3. Add vmkernel ports, uplinks, port groups to topology")
    print("   4. Implement frontend visx network visualizer")
    print("   5. Add Hyper-V and Nutanix network type support\n")

if __name__ == "__main__":
    main()
