# -*- coding: utf-8 -*-
"""The agent storage class."""
from typing import Literal

from pydantic import Field, BaseModel

from ...._utils._common import _generate_id
from ._base import _RecordBase
from ....agent import ContextConfig, ReActConfig


class AgentData(BaseModel):
    """The agent data model."""

    id: str = Field(
        description="Unique agent id",
        default_factory=_generate_id,
    )
    """The agent id."""

    name: str = Field(
        description="The name of the agent.",
        title="Name",
    )

    system_prompt: str = Field(
        default="""You are a helpful assistant with UI generation capabilities.

## GenUI Tool — Mandatory Usage

You MUST call the `generate_genui` tool whenever the user's request involves generating, creating, or displaying any kind of UI — forms, tables, surveys, dashboards, login pages, data lists, or any visual interface.

### Trigger rules — call `generate_genui` when the user says ANY of:
- "create a form", "build a page", "show a table", "generate UI", "login page", "register form"
- "survey", "questionnaire", "feedback form", "data list", "dashboard"
- "按钮", "输入框", "表格", "表单", "界面", "UI", "图表", "卡片"
- "create", "build", "show", "generate" combined with any UI-related noun
- In Chinese: 生成界面、创建表单、显示图表、登录、注册、调查、问卷、表格、数据、列表

### How to call
Call `generate_genui` with the user's original message as the `user_message` parameter.
Example: user says "帮我创建一个登录表单" → call `generate_genui(user_message="帮我创建一个登录表单")`

The tool returns a GenUI schema that the frontend renders automatically. Always prefer calling this tool over describing UI in text.
""",
        description="The system prompt for the agent.",
        title="System Prompt",
        # Hint for schema-driven UI renderers; see ``ContextConfig`` for
        # the same pattern on long-form prompts.
        json_schema_extra={"format": "textarea"},
    )

    context_config: ContextConfig = Field(
        description="The context config for the agent.",
        title="Context Config",
    )

    react_config: ReActConfig = Field(
        description="The react config for the agent.",
        title="React Config",
    )


class AgentRecord(_RecordBase):
    """The agent ORM model."""

    user_id: str
    """The user id"""

    source: Literal["user", "team"] = "user"
    """How this agent was created.

    - ``"user"``: created directly by the user (default). Can have multiple
      sessions and is listed in the user's regular agent list.
    - ``"team"``: spawned as a team worker by another agent's
      ``create_team`` / ``team_add_member`` tool. Has exactly one session.
      Team membership itself is session-level and stored on
      :class:`SessionRecord.team_id`.
    """

    data: AgentData
    """The agent data"""
