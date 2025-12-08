"""
Ollama LLM adapter for local LLM inference.
Placeholder for Phase 2 implementation.
"""

from typing import Any, Dict, List, Optional
import logging

from src.llm_gateway.base import BaseLLMAdapter
from src.config import settings

logger = logging.getLogger(__name__)


class OllamaAdapter(BaseLLMAdapter):
    """
    Ollama adapter for local LLM inference.
    
    This will be implemented in Phase 2 with actual Ollama integration.
    """
    
    def __init__(self, model_name: str = "llama3", config: Optional[Dict[str, Any]] = None):
        """
        Initialize Ollama adapter.
        
        Args:
            model_name: Name of the Ollama model
            config: Optional configuration dictionary
        """
        super().__init__(model_name, config)
        self.base_url = config.get("base_url", settings.ollama_host) if config else settings.ollama_host
        logger.info(f"Ollama adapter configured for {self.base_url}")
    
    async def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        """
        Generate text completion using Ollama.
        
        Phase 2 implementation will use httpx to call Ollama API.
        """
        logger.warning("Ollama generate not implemented - Phase 2")
        return "Not implemented - Phase 2"
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1000,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        """
        Chat completion using Ollama.
        
        Phase 2 implementation will use httpx to call Ollama API.
        """
        logger.warning("Ollama chat not implemented - Phase 2")
        return "Not implemented - Phase 2"
    
    async def embed(self, text: str) -> List[float]:
        """
        Generate embeddings using Ollama.
        
        Phase 2 implementation will use httpx to call Ollama API.
        """
        logger.warning("Ollama embed not implemented - Phase 2")
        return []
