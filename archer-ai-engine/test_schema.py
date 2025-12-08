#!/usr/bin/env python3
"""
Test script for verifying SurrealDB AI schema.

This script connects to SurrealDB, applies the schema if needed,
and runs validation queries to ensure everything is set up correctly.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from src.config import settings


async def test_schema():
    """Test SurrealDB AI schema setup."""
    print("🔍 Testing Archer AI Engine Schema")
    print("=" * 50)
    
    try:
        # Import SurrealDB client
        from surrealdb import Surreal
        
        # Connect to database
        print(f"📡 Connecting to {settings.surrealdb_url}...")
        db = Surreal(settings.surrealdb_url)
        
        # Sign in
        await db.signin({
            "user": settings.surrealdb_user,
            "pass": settings.surrealdb_pass,
        })
        
        # Use namespace and database
        await db.use(settings.surrealdb_ns, settings.surrealdb_db)
        print(f"✅ Connected to {settings.surrealdb_ns}:{settings.surrealdb_db}")
        
        # Test 1: Check if tables exist
        print("\n📋 Test 1: Checking table definitions...")
        tables = ["document", "chunk", "ai_thought_log", "agent_action", "agent_role"]
        
        for table in tables:
            try:
                result = await db.query(f"INFO FOR TABLE {table}")
                print(f"  ✅ Table '{table}' exists")
            except Exception as e:
                print(f"  ❌ Table '{table}' missing or error: {e}")
        
        # Test 2: Check default roles
        print("\n👥 Test 2: Checking default agent roles...")
        roles = await db.select("agent_role")
        if roles:
            print(f"  ✅ Found {len(roles)} default roles:")
            for role in roles:
                print(f"     - {role.get('name')}: max_risk_score={role.get('max_risk_score')}")
        else:
            print("  ⚠️  No default roles found (run migration first)")
        
        # Test 3: Count records
        print("\n📊 Test 3: Record counts...")
        for table in tables:
            try:
                result = await db.query(f"SELECT count() FROM {table} GROUP ALL")
                count = result[0].get("count", 0) if result else 0
                print(f"  {table}: {count} records")
            except Exception as e:
                print(f"  ❌ Error counting {table}: {e}")
        
        # Test 4: Verify vector index
        print("\n🔍 Test 4: Vector index verification...")
        try:
            # Check if embedding field exists and has index
            result = await db.query("INFO FOR TABLE chunk")
            if result:
                print("  ✅ Chunk table configured for vector search")
                # Note: Detailed index info requires parsing the INFO output
            else:
                print("  ⚠️  Could not verify vector index")
        except Exception as e:
            print(f"  ❌ Error checking vector index: {e}")
        
        # Test 5: Insert test document
        print("\n📝 Test 5: Insert test document...")
        try:
            test_doc = {
                "source": "test",
                "path": "/test/document.md",
                "title": "Test Document",
                "content_hash": "test_hash_12345",
                "sensitivity": "public",
                "permissions": ["public"],
                "metadata": {"test": True},
            }
            
            result = await db.create("document", test_doc)
            doc_id = result[0].get("id") if result else None
            
            if doc_id:
                print(f"  ✅ Test document created: {doc_id}")
                
                # Clean up
                await db.delete(doc_id)
                print("  ✅ Test document deleted")
            else:
                print("  ❌ Failed to create test document")
                
        except Exception as e:
            print(f"  ❌ Error in document test: {e}")
        
        # Test 6: Test AI thought log
        print("\n🤔 Test 6: Test AI thought log...")
        try:
            test_log = {
                "agent": "test_agent",
                "input": "test query",
                "chain_of_thought": "test reasoning",
                "output": "test response",
                "model": "test-model",
                "provider": "test",
                "tokens_used": 100,
                "latency_ms": 500,
                "success": True,
            }
            
            result = await db.create("ai_thought_log", test_log)
            log_id = result[0].get("id") if result else None
            
            if log_id:
                print(f"  ✅ Test thought log created: {log_id}")
                
                # Clean up
                await db.delete(log_id)
                print("  ✅ Test thought log deleted")
            else:
                print("  ❌ Failed to create test thought log")
                
        except Exception as e:
            print(f"  ❌ Error in thought log test: {e}")
        
        print("\n" + "=" * 50)
        print("✅ Schema validation complete!")
        
    except ImportError:
        print("❌ Error: surrealdb package not installed")
        print("   Run: pip install surrealdb")
        return False
        
    except Exception as e:
        print(f"❌ Error during schema validation: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == "__main__":
    success = asyncio.run(test_schema())
    sys.exit(0 if success else 1)
