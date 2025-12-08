"""Base agent abstract class."""

from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    """Abstract base class for AI agents.
    
    All specialized agents (Librarian, Ticket Assistant, Monitoring Analyst,
    Operations Agent) should inherit from this class.
    """
    
    agent_name: str
    description: str
    
    @abstractmethod
    async def process(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Process input and return result.
        
        Args:
            input_data: Input data for the agent
            
        Returns:
            Processing result
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if agent is ready to process requests.
        
        Returns:
            True if agent is healthy
        """
        pass
