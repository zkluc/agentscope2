# -*- coding: utf-8 -*-
"""Example of Agnes model calls with OpenAIMultiAgentFormatter."""
import asyncio
import os

from _utils import stream_and_collect
from agentscope.formatter import OpenAIMultiAgentFormatter
from agentscope.message import Msg, TextBlock
from agentscope.model import OpenAIChatModel
from agentscope.credential import AgnesCredential


async def example_multiagent() -> None:
    """Simulate a multi-agent conversation and let Agnes summarize it."""
    formatter = OpenAIMultiAgentFormatter()

    model = OpenAIChatModel(
        credential=AgnesCredential(
            api_key=os.environ["AGNES_API_KEY"],
            base_url="https://apihub.agnes-ai.com/v1",
        ),
        model="agnes-2.0-flash",
        stream=True,
        formatter=formatter,
    )

    msgs = [
        Msg(
            name="system",
            content=[
                TextBlock(
                    text="You are a helpful moderator. Summarize the "
                    "conversation.",
                ),
            ],
            role="system",
        ),
        Msg(
            name="alice",
            content=[
                TextBlock(
                    text="Hi Bob! What do you think about the weather today?",
                ),
            ],
            role="user",
        ),
        Msg(
            name="bob",
            content=[
                TextBlock(
                    text="It's quite sunny and warm, Alice. Perfect for a "
                    "walk!",
                ),
            ],
            role="assistant",
        ),
        Msg(
            name="alice",
            content=[
                TextBlock(text="Agreed! I might head to the park later."),
            ],
            role="user",
        ),
        Msg(
            name="bob",
            content=[
                TextBlock(
                    text="Great idea. I'll join you if I finish work early.",
                ),
            ],
            role="assistant",
        ),
        Msg(
            name="moderator",
            content=[
                TextBlock(
                    text="Please summarize the conversation above in one "
                    "sentence.",
                ),
            ],
            role="user",
        ),
    ]

    print("=== Multi-Agent Formatter Call ===")
    await stream_and_collect(await model(msgs))


if __name__ == "__main__":
    asyncio.run(example_multiagent())
