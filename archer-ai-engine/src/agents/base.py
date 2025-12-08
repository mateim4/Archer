"""Base agent abstract class."""

from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    """
    Base class for AI agents.

    Future agents (Librarian, Ticket Assistant, etc.) will inherit from this.
    """

    agent_name: str
    agent_description: str

    @abstractmethod
    async def process(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """
        Process input and return output.

        Args:
            input_data: Agent-specific input data

        Returns:
            Agent-specific output data
        """
        pass

    @abstractmethod
    async def health_check(self) -> dict[str, bool | str]:
        """
        Check agent health and readiness.

        Returns:
            Health status dictionary
        """
        pass
