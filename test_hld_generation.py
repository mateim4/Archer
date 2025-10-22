#!/usr/bin/env python3
"""
Test script for HLD Document Generation API
Tests the POST /projects/:id/hld endpoint with various scenarios
"""

import requests
import json
from datetime import datetime
from pathlib import Path

BASE_URL = "http://localhost:3001/api/v1/migration-wizard"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_result(test_name, success, details=""):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} - {test_name}")
    if details:
        print(f"   {details}")

def save_hld_document(content, filename):
    """Save HLD document to file"""
    output_dir = Path("test_outputs")
    output_dir.mkdir(exist_ok=True)
    filepath = output_dir / filename
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"   📄 Saved to: {filepath}")
    return filepath

def test_list_projects():
    """Test 1: List all projects to find one for HLD generation"""
    print_section("TEST 1: List Projects")
    
    try:
        response = requests.get(f"{BASE_URL}/projects")
        
        if response.status_code == 200:
            data = response.json()
            
            # Handle wrapped response format
            if isinstance(data, dict) and 'result' in data:
                projects = data['result'].get('projects', [])
            elif isinstance(data, list):
                projects = data
            else:
                projects = []
            
            print(f"   Found {len(projects)} project(s)")
            
            if projects:
                for idx, project in enumerate(projects, 1):
                    # Handle both object and string ID formats
                    project_id = project.get('id')
                    if isinstance(project_id, dict):
                        # SurrealDB Thing format can be nested
                        if 'id' in project_id and isinstance(project_id['id'], dict):
                            project_id = project_id['id'].get('String') or project_id['id'].get('id', 'N/A')
                        else:
                            project_id = project_id.get('String') or project_id.get('id', 'N/A')
                    
                    print(f"\n   Project {idx}:")
                    print(f"      ID: {project_id}")
                    print(f"      Name: {project.get('name', 'N/A')}")
                    print(f"      VMs: {project.get('total_vms', 0)}")
                    print(f"      Clusters: {project.get('total_clusters', 0)}")
                    print(f"      Status: {project.get('status', 'N/A')}")
                
                print_result("List Projects", True, f"Found {len(projects)} project(s)")
                return projects[0] if projects else None
            else:
                print_result("List Projects", True, "No projects found - need to create one first")
                return None
        else:
            print_result("List Projects", False, f"Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print_result("List Projects", False, f"Exception: {str(e)}")
        return None

def test_generate_hld_full(project_id):
    """Test 2: Generate HLD with all sections (network topology + VM placements)"""
    print_section("TEST 2: Generate Full HLD Document")
    
    try:
        payload = {
            "include_network_topology": True,
            "include_vm_placements": True
        }
        
        response = requests.post(
            f"{BASE_URL}/projects/{project_id}/hld",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Handle wrapped response format
            if isinstance(data, dict) and 'result' in data:
                result = data['result']
            else:
                result = data
            
            print(f"\n   Document Format: {result.get('document_format')}")
            print(f"   Generated At: {result.get('generated_at')}")
            print(f"   Project ID: {result.get('project_id')}")
            
            content = result.get('content', '')
            print(f"   Document Length: {len(content)} characters")
            print(f"   Lines: {len(content.splitlines())} lines")
            
            # Verify sections
            sections = [
                "Executive Summary",
                "Current State Analysis",
                "Target Architecture",
                "VM Placement Strategy",
                "Network Design",
                "Migration Approach",
                "Risks and Mitigation"
            ]
            
            missing_sections = []
            for section in sections:
                if section not in content:
                    missing_sections.append(section)
            
            if missing_sections:
                print(f"\n   ⚠️  Missing sections: {', '.join(missing_sections)}")
            else:
                print(f"\n   ✅ All 7 sections present")
            
            # Check for Mermaid diagram
            has_mermaid = "```mermaid" in content
            print(f"   Mermaid Diagram: {'✅ Present' if has_mermaid else '❌ Missing'}")
            
            # Save document
            filename = f"hld_full_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            filepath = save_hld_document(content, filename)
            
            # Print preview
            lines = content.splitlines()
            print(f"\n   📄 Document Preview (first 20 lines):")
            print("   " + "-"*76)
            for line in lines[:20]:
                print(f"   {line}")
            print("   " + "-"*76)
            print(f"   ... ({len(lines) - 20} more lines)")
            
            success = response.status_code == 200 and len(missing_sections) == 0
            print_result("Generate Full HLD", success, f"Document saved to {filepath.name}")
            return True
            
        else:
            print_result("Generate Full HLD", False, f"Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print_result("Generate Full HLD", False, f"Exception: {str(e)}")
        return False

def test_generate_hld_minimal(project_id):
    """Test 3: Generate HLD with minimal sections (no topology, no placements)"""
    print_section("TEST 3: Generate Minimal HLD Document")
    
    try:
        payload = {
            "include_network_topology": False,
            "include_vm_placements": False
        }
        
        response = requests.post(
            f"{BASE_URL}/projects/{project_id}/hld",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Handle wrapped response format
            if isinstance(data, dict) and 'result' in data:
                result = data['result']
            else:
                result = data
            
            content = result.get('content', '')
            
            print(f"\n   Document Length: {len(content)} characters")
            print(f"   Lines: {len(content.splitlines())} lines")
            
            # Verify optional sections are NOT included
            has_placement_section = "VM Placement Strategy" in content
            has_network_section = "Network Design" in content
            has_mermaid = "```mermaid" in content
            
            print(f"\n   VM Placement Section: {'❌ Present (should be excluded)' if has_placement_section else '✅ Excluded'}")
            print(f"   Network Design Section: {'❌ Present (should be excluded)' if has_network_section else '✅ Excluded'}")
            print(f"   Mermaid Diagram: {'❌ Present (should be excluded)' if has_mermaid else '✅ Excluded'}")
            
            # Save document
            filename = f"hld_minimal_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            filepath = save_hld_document(content, filename)
            
            success = (response.status_code == 200 and 
                      not has_placement_section and 
                      not has_network_section and 
                      not has_mermaid)
            
            print_result("Generate Minimal HLD", success, f"Document saved to {filepath.name}")
            return True
            
        else:
            print_result("Generate Minimal HLD", False, f"Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print_result("Generate Minimal HLD", False, f"Exception: {str(e)}")
        return False

def test_generate_hld_network_only(project_id):
    """Test 4: Generate HLD with network topology only"""
    print_section("TEST 4: Generate HLD with Network Topology Only")
    
    try:
        payload = {
            "include_network_topology": True,
            "include_vm_placements": False
        }
        
        response = requests.post(
            f"{BASE_URL}/projects/{project_id}/hld",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Handle wrapped response format
            if isinstance(data, dict) and 'result' in data:
                result = data['result']
            else:
                result = data
            
            content = result.get('content', '')
            
            print(f"\n   Document Length: {len(content)} characters")
            
            has_network = "Network Design" in content
            has_mermaid = "```mermaid" in content
            has_placement = "VM Placement Strategy" in content
            
            print(f"   Network Design Section: {'✅ Present' if has_network else '❌ Missing'}")
            print(f"   Mermaid Diagram: {'✅ Present' if has_mermaid else '❌ Missing'}")
            print(f"   VM Placement Section: {'❌ Present (should be excluded)' if has_placement else '✅ Excluded'}")
            
            # Save document
            filename = f"hld_network_only_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            filepath = save_hld_document(content, filename)
            
            success = response.status_code == 200 and has_network and not has_placement
            print_result("Generate Network-Only HLD", success, f"Document saved to {filepath.name}")
            return True
            
        else:
            print_result("Generate Network-Only HLD", False, f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        print_result("Generate Network-Only HLD", False, f"Exception: {str(e)}")
        return False

def test_invalid_project_id():
    """Test 5: Test with invalid project ID"""
    print_section("TEST 5: Invalid Project ID")
    
    try:
        payload = {
            "include_network_topology": True,
            "include_vm_placements": True
        }
        
        response = requests.post(
            f"{BASE_URL}/projects/nonexistent_project_999/hld",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 404 or 500
        if response.status_code in [404, 500]:
            print_result("Invalid Project ID", True, f"Correctly returned {response.status_code}")
            return True
        else:
            print_result("Invalid Project ID", False, f"Expected 404/500, got {response.status_code}")
            return False
            
    except Exception as e:
        print_result("Invalid Project ID", False, f"Exception: {str(e)}")
        return False

def test_check_vm_and_cluster_data(project_id):
    """Test 6: Check if project has VM and cluster data"""
    print_section("TEST 6: Check Project Data Availability")
    
    try:
        # Check VMs
        vm_response = requests.get(f"{BASE_URL}/projects/{project_id}/vms")
        vm_count = 0
        if vm_response.status_code == 200:
            vms = vm_response.json()
            vm_count = len(vms)
            print(f"\n   ✅ VMs: {vm_count} found")
            if vm_count > 0:
                print(f"      Sample VM: {vms[0].get('name', 'N/A')}")
        else:
            print(f"   ⚠️  Could not fetch VMs: {vm_response.status_code}")
        
        # Check Clusters
        cluster_response = requests.get(f"{BASE_URL}/projects/{project_id}/clusters")
        cluster_count = 0
        if cluster_response.status_code == 200:
            clusters = cluster_response.json()
            cluster_count = len(clusters)
            print(f"   ✅ Clusters: {cluster_count} found")
            if cluster_count > 0:
                print(f"      Sample Cluster: {clusters[0].get('name', 'N/A')}")
        else:
            print(f"   ⚠️  Could not fetch Clusters: {cluster_response.status_code}")
        
        # Check Placements
        placement_response = requests.get(f"{BASE_URL}/projects/{project_id}/placements")
        placement_count = 0
        if placement_response.status_code == 200:
            placements = placement_response.json()
            placement_count = len(placements)
            print(f"   ✅ Placements: {placement_count} found")
        else:
            print(f"   ⚠️  Could not fetch Placements: {placement_response.status_code}")
        
        # Check Network Mappings
        network_response = requests.get(f"{BASE_URL}/projects/{project_id}/network/vlan-mappings")
        network_count = 0
        if network_response.status_code == 200:
            networks = network_response.json()
            network_count = len(networks)
            print(f"   ✅ Network Mappings: {network_count} found")
        else:
            print(f"   ⚠️  Could not fetch Network Mappings: {network_response.status_code}")
        
        print(f"\n   Summary:")
        print(f"      VMs: {vm_count}")
        print(f"      Clusters: {cluster_count}")
        print(f"      Placements: {placement_count}")
        print(f"      Network Mappings: {network_count}")
        
        print_result("Check Project Data", True, "Data availability checked")
        return True
        
    except Exception as e:
        print_result("Check Project Data", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all HLD generation tests"""
    print("\n" + "🧪"*40)
    print("  HLD DOCUMENT GENERATION TEST SUITE")
    print("  Testing POST /projects/:id/hld endpoint")
    print("🧪"*40)
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/projects", timeout=2)
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Backend not running on http://localhost:3001")
        print("   Please start the backend first:")
        print("   cd backend && cargo run")
        return
    
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0
    }
    
    # Test 1: Get a project
    project = test_list_projects()
    
    if not project:
        print("\n⚠️  No projects found. Please create a project first using the Migration Wizard.")
        print("   You can create a project by:")
        print("   1. POST /projects with project details")
        print("   2. Upload RVTools data")
        print("   3. Create clusters")
        return
    
    # Handle both object and string ID formats
    project_id = project.get('id')
    
    if isinstance(project_id, dict):
        # SurrealDB Thing format can be:
        # {'String': 'id'} or
        # {'tb': 'table', 'id': {'String': 'id'}} or
        # {'id': 'id'}
        if 'id' in project_id and isinstance(project_id['id'], dict):
            # Nested format
            project_id = project_id['id'].get('String') or project_id['id'].get('id')
        else:
            # Flat format
            project_id = project_id.get('String') or project_id.get('id')
    
    print(f"\n📋 Using Project: {project.get('name')} (ID: {project_id})")
    
    # Test 6: Check data availability
    test_check_vm_and_cluster_data(project_id)
    
    # Test 2: Generate full HLD
    if test_generate_hld_full(project_id):
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    # Test 3: Generate minimal HLD
    if test_generate_hld_minimal(project_id):
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    # Test 4: Generate network-only HLD
    if test_generate_hld_network_only(project_id):
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    # Test 5: Invalid project ID
    if test_invalid_project_id():
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    # Final summary
    print_section("TEST SUMMARY")
    print(f"\n   Total Tests: {results['total']}")
    print(f"   ✅ Passed: {results['passed']}")
    print(f"   ❌ Failed: {results['failed']}")
    
    pass_rate = (results['passed'] / results['total'] * 100) if results['total'] > 0 else 0
    print(f"\n   Pass Rate: {pass_rate:.1f}%")
    
    if results['failed'] == 0:
        print("\n   🎉 ALL TESTS PASSED! 🎉")
    else:
        print(f"\n   ⚠️  {results['failed']} test(s) failed")
    
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    main()
