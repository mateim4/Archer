"""
Base agent class for all AI agents.
Placeholder for Phase 2 implementation.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Abstract base class for all AI agents.
    
    This will be implemented in Phase 2 with actual agent logic.
    """
    
    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        """
        Initialize base agent.
        
        Args:
            name: Agent name
            config: Optional configuration dictionary
        """
        self.name = name
        self.config = config or {}
        logger.info(f"Initialized agent: {name}")
    
    @abstractmethod
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process input and return output.
        
        Args:
            input_data: Input data dictionary
            
        Returns:
            Output data dictionary
        """
        pass
    
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """
        Validate input data.
        
        Args:
            input_data: Input data to validate
            
        Returns:
            True if valid, False otherwise
        """
        return isinstance(input_data, dict)
