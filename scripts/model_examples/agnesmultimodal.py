# -*- coding: utf-8 -*-
"""Example of Agnes model multimodal (vision) calls using DataBlock."""
import asyncio
import base64
import os
from pathlib import Path

from _utils import stream_and_collect
from agentscope.message import (
    Msg,
    TextBlock,
    DataBlock,
    URLSource,
    Base64Source,
)
from agentscope.model import OpenAIChatModel
from agentscope.credential import AgnesCredential

TEST_IMAGE_URL = (
    "https://help-static-aliyun-doc.aliyuncs.com/file-manage"
    "-files/zh-CN/20241022/emyrja/dog_and_girl.jpeg"
)


async def example_image_url() -> None:
    """Call Agnes with an image URL and ask what is in the image."""
    model = OpenAIChatModel(
        credential=AgnesCredential(
            api_key=os.environ["AGNES_API_KEY"],
            base_url="https://apihub.agnes-ai.com/v1",
        ),
        model="agnes-2.0-flash",
        stream=True,
    )

    image_block = DataBlock(
        source=URLSource(
            url=TEST_IMAGE_URL,
            media_type="image/jpeg",
        ),
    )

    msgs = [
        Msg(
            name="user",
            content=[
                TextBlock(
                    text="What animal is in this image? Describe it briefly.",
                ),
                image_block,
            ],
            role="user",
        ),
    ]

    print("=== Multimodal Call (Image URL) ===")
    await stream_and_collect(await model(msgs))


def _build_model() -> OpenAIChatModel:
    return OpenAIChatModel(
        credential=AgnesCredential(
            api_key=os.environ["AGNES_API_KEY"],
            base_url="https://apihub.agnes-ai.com/v1",
        ),
        model="agnes-2.0-flash",
        stream=True,
    )


async def example_image_local_path() -> None:
    """Call Agnes with a local image using a ``file://`` URL."""
    model = _build_model()

    abs_path = str(Path(__file__).parent / "test.jpeg")
    msgs = [
        Msg(
            name="user",
            content=[
                TextBlock(
                    text="What is happening in this image? Describe it "
                    "briefly.",
                ),
                DataBlock(
                    source=URLSource(
                        url=f"file://{abs_path}",
                        media_type="image/jpeg",
                    ),
                ),
            ],
            role="user",
        ),
    ]

    print("=== Local Path Call (file://) ===")
    await stream_and_collect(await model(msgs))


async def example_image_base64() -> None:
    """Call Agnes with a local image using explicit base64 encoding."""
    model = _build_model()

    with open(Path(__file__).parent / "test.jpeg", "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")

    msgs = [
        Msg(
            name="user",
            content=[
                TextBlock(
                    text="What is happening in this image? Describe it "
                    "briefly.",
                ),
                DataBlock(
                    source=Base64Source(data=data, media_type="image/jpeg"),
                ),
            ],
            role="user",
        ),
    ]

    print("=== Explicit Base64 Call ===")
    await stream_and_collect(await model(msgs))


if __name__ == "__main__":
    asyncio.run(example_image_url())
    asyncio.run(example_image_local_path())
    asyncio.run(example_image_base64())
