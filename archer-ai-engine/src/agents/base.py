"""Base agent class for all AI agents (placeholder for future implementation)."""

from abc import ABC, abstractmethod

from ..llm_gateway.base import BaseLLMAdapter, ChatMessage, LLMResponse


class BaseAgent(ABC):
    """Abstract base class for AI agents.

    All specialized agents (Librarian, Ticket Assistant, etc.) will
    inherit from this class to ensure consistent behavior.
    """

    def __init__(self, llm_adapter: BaseLLMAdapter, name: str):
        """Initialize the base agent.

        Args:
            llm_adapter: LLM adapter to use for AI operations
            name: Agent name for logging and identification
        """
        self.llm_adapter = llm_adapter
        self.name = name

    @abstractmethod
    async def process(self, input_data: dict) -> dict:
        """Process input and generate a response.

        Args:
            input_data: Input data specific to the agent's function

        Returns:
            Response data specific to the agent's function
        """
        pass

    async def _chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        """Internal method to interact with LLM.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate

        Returns:
            LLM response
        """
        return await self.llm_adapter.chat(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    def _build_system_prompt(self) -> str:
        """Build the system prompt for this agent.

        Returns:
            System prompt string
        """
        return f"You are {self.name}, an AI assistant for the Archer ITSM platform."
