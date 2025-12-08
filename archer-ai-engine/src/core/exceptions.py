"""Custom exception classes for the AI Engine."""


class AIEngineError(Exception):
    """Base exception for all AI Engine errors."""

    pass


class LLMError(AIEngineError):
    """Base exception for LLM-related errors."""

    pass


class LLMConnectionError(LLMError):
    """Raised when unable to connect to LLM provider."""

    pass


class LLMRateLimitError(LLMError):
    """Raised when LLM provider rate limit is exceeded."""

    pass


class LLMInvalidRequestError(LLMError):
    """Raised when LLM request is malformed or invalid."""

    pass


class LLMAuthenticationError(LLMError):
    """Raised when LLM provider authentication fails."""

    pass


class LLMTimeoutError(LLMError):
    """Raised when LLM request times out."""

    pass


class ConfigurationError(AIEngineError):
    """Raised when configuration is invalid or missing."""

    pass
