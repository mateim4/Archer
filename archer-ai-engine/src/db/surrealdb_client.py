"""
SurrealDB async client for Archer AI Engine.
Provides connection management and query execution.
"""

import logging
from typing import Any, Dict, Optional
from contextlib import asynccontextmanager

from surrealdb import Surreal

from src.config import settings

logger = logging.getLogger(__name__)


class SurrealDBClient:
    """Async SurrealDB client wrapper."""

    def __init__(self):
        """Initialize SurrealDB client."""
        self.client: Optional[Surreal] = None
        self.connected: bool = False

    async def connect(self) -> None:
        """Establish connection to SurrealDB."""
        try:
            self.client = Surreal(settings.surrealdb_url)
            await self.client.connect()
            
            # Sign in
            await self.client.signin({
                "user": settings.surrealdb_user,
                "pass": settings.surrealdb_pass,
            })
            
            # Use namespace and database
            await self.client.use(settings.surrealdb_ns, settings.surrealdb_db)
            
            self.connected = True
            logger.info(
                f"Connected to SurrealDB at {settings.surrealdb_url} "
                f"(ns: {settings.surrealdb_ns}, db: {settings.surrealdb_db})"
            )
        except Exception as e:
            self.connected = False
            logger.error(f"Failed to connect to SurrealDB: {e}")
            raise

    async def disconnect(self) -> None:
        """Close SurrealDB connection."""
        if self.client:
            try:
                await self.client.close()
                self.connected = False
                logger.info("Disconnected from SurrealDB")
            except Exception as e:
                logger.error(f"Error disconnecting from SurrealDB: {e}")

    async def ping(self) -> bool:
        """Check if database connection is alive."""
        if not self.connected or not self.client:
            return False
        
        try:
            # Simple query to check connection
            await self.client.query("SELECT * FROM system LIMIT 1")
            return True
        except Exception as e:
            logger.error(f"Database ping failed: {e}")
            return False

    async def query(self, sql: str, vars: Optional[Dict[str, Any]] = None) -> Any:
        """
        Execute a SurrealDB query.
        
        Args:
            sql: SurrealQL query string
            vars: Optional query variables
            
        Returns:
            Query result
        """
        if not self.connected or not self.client:
            raise RuntimeError("Database not connected")
        
        try:
            if vars:
                result = await self.client.query(sql, vars)
            else:
                result = await self.client.query(sql)
            return result
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise


# Global database client instance
_db_client: Optional[SurrealDBClient] = None


async def get_db_client() -> SurrealDBClient:
    """
    Get or create global database client instance.
    
    Returns:
        SurrealDBClient instance
    """
    global _db_client
    
    if _db_client is None:
        _db_client = SurrealDBClient()
        await _db_client.connect()
    
    return _db_client


@asynccontextmanager
async def db_connection():
    """
    Context manager for database connections.
    
    Usage:
        async with db_connection() as db:
            result = await db.query("SELECT * FROM users")
    """
    client = await get_db_client()
    try:
        yield client
    finally:
        # Connection pooling will be handled globally
        pass
