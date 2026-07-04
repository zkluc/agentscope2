# -*- coding: utf-8 -*-
"""Example of Agnes multi-agent collaboration.

Demonstrates creating multiple agents with different roles and showing how
their outputs can be chained together for collaborative problem solving.
"""
import asyncio
import os

from agentscope.agent import Agent
from agentscope.model import AgnesChatModel
from agentscope.credential import AgnesCredential
from agentscope.message import Msg, TextBlock


async def example_multiagent_collaboration() -> None:
    """Create a researcher-writer team that collaborates on a task.

    The researcher agent gathers information, then the writer agent
    synthesizes the findings into a coherent response.
    """
    model = AgnesChatModel(
        credential=AgnesCredential(
            api_key=os.environ["AGNES_API_KEY"],
        ),
        model="agnes-2.0-flash",
        stream=False,
    )

    # Researcher agent - analyzes and provides factual information
    researcher = Agent(
        name="researcher",
        system_prompt=(
            "You are a researcher agent. Your role is to analyze topics "
            "and provide factual, well-structured information. Be concise "
            "but thorough. Focus on accuracy and key insights."
        ),
        model=model,
    )

    # Writer agent - synthesizes information into polished responses
    writer = Agent(
        name="writer",
        system_prompt=(
            "You are a writer agent. Your role is to take research findings "
            "and synthesize them into clear, engaging prose. Structure your "
            "response logically and ensure it flows well."
        ),
        model=model,
    )

    # Moderator agent - coordinates and provides final summary
    moderator = Agent(
        name="moderator",
        system_prompt=(
            "You are a moderator agent. Review the research findings and "
            "writer's synthesis. Provide a final summary that captures the "
            "key points in a well-organized format."
        ),
        model=model,
    )

    # User's original question
    user_question = Msg(
        name="user",
        content=[TextBlock(text="What are the latest trends in AI agents?")],
        role="user",
    )

    print("=" * 60)
    print("Multi-Agent Collaboration: Researcher -> Writer -> Moderator")
    print("=" * 60)
    print()

    # Step 1: Researcher analyzes the topic
    print("[1/3] Researcher analyzing...")
    print("-" * 40)
    researcher_result = await researcher.reply(user_question)
    print(researcher_result.content)
    print()

    # Step 2: Writer synthesizes the research
    print("[2/3] Writer synthesizing...")
    print("-" * 40)
    writer_input = Msg(
        name="user",
        content=[
            TextBlock(
                text=(
                    "Based on the following research, write a coherent "
                    "summary:\n\n"
                    f"{researcher_result.content}"
                ),
            ),
        ],
        role="user",
    )
    writer_result = await writer.reply(writer_input)
    print(writer_result.content)
    print()

    # Step 3: Moderator provides final review
    print("[3/3] Moderator reviewing...")
    print("-" * 40)
    moderator_input = Msg(
        name="user",
        content=[
            TextBlock(
                text=(
                    "Review the following synthesis and provide a final "
                    "polished summary:\n\n"
                    f"{writer_result.content}"
                ),
            ),
        ],
        role="user",
    )
    moderator_result = await moderator.reply(moderator_input)
    print(moderator_result.content)
    print()

    print("=" * 60)
    print("Collaboration complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(example_multiagent_collaboration())
