# -*- coding: utf-8 -*-
"""Example of Agnes multi-agent multimodal calls."""
import asyncio
import base64
import os
from pathlib import Path

from _utils import stream_and_collect
from agentscope.formatter import OpenAIMultiAgentFormatter
from agentscope.message import (
    Msg,
    TextBlock,
    DataBlock,
    URLSource,
)
from agentscope.model import OpenAIChatModel
from agentscope.credential import AgnesCredential

TEST_IMAGE_URL = (
    "https://help-static-aliyun-doc.aliyuncs.com/file-manage"
    "-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"
)


async def example_multiagent_multimodal() -> None:
    """Multi-agent conversation with image input for Agnes."""
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

    image_block = DataBlock(
        source=URLSource(
            url=TEST_IMAGE_URL,
            media_type="image/jpeg",
        ),
    )

    msgs = [
        Msg(
            name="system",
            content=[
                TextBlock(
                    text="You are a helpful moderator. Summarize the "
                    "conversation and describe the image.",
                ),
            ],
            role="system",
        ),
        Msg(
            name="alice",
            content=[
                TextBlock(
                    text="What do you see in this image?",
                ),
                image_block,
            ],
            role="user",
        ),
        Msg(
            name="bob",
            content=[
                TextBlock(
                    text="It looks like a dog and a girl outdoors.",
                ),
            ],
            role="assistant",
        ),
        Msg(
            name="moderator",
            content=[
                TextBlock(
                    text="Please summarize the conversation above.",
                ),
            ],
            role="user",
        ),
    ]

    print("=== Multi-Agent Multimodal Call ===")
    await stream_and_collect(await model(msgs))


if __name__ == "__main__":
    asyncio.run(example_multiagent_multimodal())
