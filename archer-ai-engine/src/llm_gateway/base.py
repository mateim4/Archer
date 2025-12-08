"""
Base LLM adapter interface.
Placeholder for Phase 2 implementation.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class BaseLLMAdapter(ABC):
    """
    Abstract base class for LLM adapters.
    
    This will be implemented in Phase 2 with actual LLM integration.
    Supports pluggable backends (Ollama, OpenAI, Anthropic, etc.).
    """
    
    def __init__(self, model_name: str, config: Optional[Dict[str, Any]] = None):
        """
        Initialize LLM adapter.
        
        Args:
            model_name: Name of the model to use
            config: Optional configuration dictionary
        """
        self.model_name = model_name
        self.config = config or {}
        logger.info(f"Initialized LLM adapter: {model_name}")
    
    @abstractmethod
    async def generate(
        self, 
        prompt: str, 
        system_message: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        """
        Generate text completion.
        
        Args:
            prompt: Input prompt
            system_message: Optional system message
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Additional provider-specific parameters
            
        Returns:
            Generated text
        """
        pass
    
    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        """
        Chat completion with message history.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Additional provider-specific parameters
            
        Returns:
            Generated response
        """
        pass
    
    @abstractmethod
    async def embed(self, text: str) -> List[float]:
        """
        Generate embeddings for text.
        
        Args:
            text: Input text to embed
            
        Returns:
            List of embedding values
        """
        pass
