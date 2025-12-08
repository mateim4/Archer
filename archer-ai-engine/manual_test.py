#!/usr/bin/env python3
"""Manual test script for LLM Gateway functionality.

This script demonstrates how to use the LLM Gateway with different providers.
Run this script with appropriate API keys configured in .env file.

Usage:
    python manual_test.py
"""

import asyncio

from src.llm_gateway.base import ChatMessage
from src.llm_gateway.router import get_llm_router


async def test_provider(provider_name: str) -> None:
    """Test a specific LLM provider.

    Args:
        provider_name: Name of the provider to test (ollama, openai, anthropic)
    """
    print(f"\n{'=' * 60}")
    print(f"Testing {provider_name.upper()} Provider")
    print(f"{'=' * 60}")

    router = get_llm_router()

    try:
        adapter = router.get_adapter(provider_name)
        print(f"✓ Adapter initialized: {type(adapter).__name__}")
    except ValueError as e:
        print(f"✗ Provider not available: {e}")
        return

    # Health check
    print("\n1. Health Check:")
    is_healthy = await adapter.health_check()
    if is_healthy:
        print("✓ Provider is healthy and accessible")
    else:
        print("✗ Provider is not healthy or not accessible")
        return

    # Test simple chat
    print("\n2. Simple Chat Test:")
    messages = [
        ChatMessage(role="system", content="You are a helpful assistant."),
        ChatMessage(role="user", content="Say 'Hello from Archer AI Engine!' and nothing else."),
    ]

    try:
        response = await adapter.chat(messages, temperature=0.1, max_tokens=50)
        print(f"✓ Response received:")
        print(f"  Content: {response.content}")
        print(f"  Model: {response.model}")
        print(f"  Tokens: {response.tokens_used or 'N/A'}")
    except Exception as e:
        print(f"✗ Chat failed: {e}")
        return

    # Test streaming (only print first few chunks)
    print("\n3. Streaming Chat Test:")
    print("✓ Streaming response: ", end="", flush=True)
    chunk_count = 0
    max_chunks = 10

    try:
        async for chunk in adapter.stream_chat(messages, temperature=0.1, max_tokens=50):
            print(chunk, end="", flush=True)
            chunk_count += 1
            if chunk_count >= max_chunks:
                print("\n  (truncated for brevity)", flush=True)
                break
        print()
    except Exception as e:
        print(f"\n✗ Streaming failed: {e}")


async def main() -> None:
    """Main test function."""
    print("=" * 60)
    print("Archer AI Engine - LLM Gateway Manual Test")
    print("=" * 60)

    router = get_llm_router()
    providers = router.list_available_providers()

    print(f"\nAvailable providers: {', '.join(providers)}")
    print(f"Primary provider: {router.primary_provider}")

    # Test each available provider
    for provider in providers:
        await test_provider(provider)

    print(f"\n{'=' * 60}")
    print("Manual test complete!")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    asyncio.run(main())
