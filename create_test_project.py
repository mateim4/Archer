#!/usr/bin/env python3
"""
Create a sample project with test data for HLD generation testing
"""

import requests
import json

BASE_URL = "http://localhost:3001/api/v1/migration-wizard"

def create_project():
    """Create a test migration project"""
    print("Creating test project...")
    
    project_data = {
        "name": "HLD Test Project",
        "description": "Test project for HLD document generation testing",
        "status": "Planning"
    }
    
    response = requests.post(
        f"{BASE_URL}/projects",
        json=project_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code in [200, 201]:
        result = response.json()
        # Handle wrapped response format
        if isinstance(result, dict) and 'result' in result:
            project_id = result['result'].get('id')
        else:
            project_id = result.get('id')
        print(f"✅ Project created: {project_id}")
        return project_id
    else:
        print(f"❌ Failed to create project: {response.status_code}")
        print(response.text)
        return None

def create_cluster(project_id):
    """Create a test destination cluster"""
    print("Creating test cluster...")
    
    cluster_data = {
        "project_id": f"migration_wizard_project:{project_id}",
        "name": "Production Cluster 1",
        "description": "Primary production cluster for VM placement",
        "cpu_ghz": 2.5,
        "total_cores": 128,
        "memory_gb": 1024,
        "storage_tb": 50.0,
        "network_bandwidth_gbps": 25.0,
        "cpu_oversubscription_ratio": 2.0,
        "memory_oversubscription_ratio": 1.5,
        "strategy": "Replatform"
    }
    
    response = requests.post(
        f"{BASE_URL}/projects/{project_id}/clusters",
        json=cluster_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code in [200, 201]:
        print(f"✅ Cluster created")
        return True
    else:
        print(f"❌ Failed to create cluster: {response.status_code}")
        print(response.text)
        return False

def create_vlan_mapping(project_id):
    """Create a test VLAN mapping"""
    print("Creating test VLAN mapping...")
    
    mapping_data = {
        "project_id": f"migration_wizard_project:{project_id}",
        "source_vlan_id": 100,
        "source_vlan_name": "Production Network",
        "target_vlan_id": 200,
        "target_vlan_name": "Hyper-V Production",
        "purpose": "Production",
        "notes": "Main production network mapping"
    }
    
    response = requests.post(
        f"{BASE_URL}/projects/{project_id}/network/vlan-mappings",
        json=mapping_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code in [200, 201]:
        print(f"✅ VLAN mapping created")
        return True
    else:
        print(f"❌ Failed to create VLAN mapping: {response.status_code}")
        print(response.text)
        return False

def main():
    print("="*80)
    print("  CREATE TEST PROJECT FOR HLD GENERATION")
    print("="*80 + "\n")
    
    # Create project
    project_id = create_project()
    if not project_id:
        print("\n❌ Failed to create project. Exiting.")
        return
    
    # Create cluster
    create_cluster(project_id)
    
    # Create VLAN mapping
    create_vlan_mapping(project_id)
    
    print("\n" + "="*80)
    print(f"✅ Test project created successfully!")
    print(f"   Project ID: {project_id}")
    print(f"\n   You can now run: python3 test_hld_generation.py")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
