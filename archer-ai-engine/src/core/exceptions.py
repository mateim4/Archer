"""Custom exception classes for the AI Engine."""


class AIEngineException(Exception):
    """Base exception for all AI Engine errors."""
    
    def __init__(self, message: str, details: dict | None = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class LLMProviderException(AIEngineException):
    """Exception raised when an LLM provider encounters an error."""
    
    def __init__(self, provider: str, message: str, details: dict | None = None):
        self.provider = provider
        super().__init__(f"[{provider}] {message}", details)


class ConfigurationException(AIEngineException):
    """Exception raised for configuration errors."""
    pass


class ValidationException(AIEngineException):
    """Exception raised for validation errors."""
    pass
