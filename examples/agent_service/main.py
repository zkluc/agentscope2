# -*- coding: utf-8 -*-
"""The example script to start the agent service."""
import os

import uvicorn
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware

from agentscope.app import create_app, SubAgentTemplate
from agentscope.app.message_bus import InMemoryMessageBus
from agentscope.app.rag.knowledge_base_manager import CollectionPerKbManager
from agentscope.app.storage import RedisStorage
from agentscope.app.workspace_manager import LocalWorkspaceManager
# 如果需要 MCP 工具，取消注释以下导入
# from agentscope.mcp import MCPClient, StdioMCPConfig, HttpMCPConfig
from agentscope.permission import PermissionContext, PermissionMode
from agentscope.rag import QdrantStore
from agentscope.tool import ToolBase

# 导入 GenUI 工具
from genui_tool import genui_tool


# GenUI 工具工厂函数
async def genui_tool_factory(
    user_id: str,
    agent_id: str,
    session_id: str,
) -> list[ToolBase]:
    """为每个 agent 添加 GenUI 工具"""
    return [genui_tool]

# MCP 工具配置（按需启用）
default_mcps = []

# 如果需要 browser-use MCP，取消注释以下配置
# default_mcps.append(
#     MCPClient(
#         name="browser-use",
#         mcp_config=StdioMCPConfig(
#             command="npx",
#             args=["@playwright/mcp@latest"],
#         ),
#         is_stateful=True,
#     ),
# )

# 如果需要高德地图 MCP，设置 AMAP_API_KEY 环境变量后取消注释
# if os.getenv("AMAP_API_KEY"):
#     default_mcps.append(
#         MCPClient(
#             name="amap",
#             mcp_config=HttpMCPConfig(
#                 url=f"https://mcp.amap.com/mcp?key="
#                 f"{os.environ['AMAP_API_KEY']}",
#             ),
#             is_stateful=False,
#         ),
#     )

storage = RedisStorage(
    host="localhost",
    port=6379,
)

vector_store = QdrantStore(location=":memory:")

app = create_app(
    storage=storage,
    message_bus=InMemoryMessageBus(),
    # -- To use a Redis-backed message bus instead (recommended for
    # -- multi-process / production deployments), uncomment the lines
    # -- below and replace the InMemoryMessageBus() above:
    #
    # from agentscope.app.message_bus import RedisMessageBus
    # message_bus=RedisMessageBus(
    #     host="localhost",
    #     port=6379,
    # ),
    workspace_manager=LocalWorkspaceManager(
        basedir=os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "workspaces",
        ),
        # The default MCP servers that will be added into the workspace
        default_mcps=default_mcps,
    ),
    # Knowledge base feature — backed by an in-memory Qdrant store. The
    # CollectionPerKbManager allocates one collection per knowledge base,
    # so any embedding dimension is allowed.
    knowledge_base_manager=CollectionPerKbManager(
        storage=storage,
        vector_store=vector_store,
    ),
    # Customize your own subagent templates
    custom_subagent_templates=[
        SubAgentTemplate(
            type="explorer",
            description=(
                "Read-only agents specialized in exploration tasks. It can "
                "read files but cannot modify, create, or delete them. Use "
                "this agent type when you need to investigate the codebase, "
                "understand its structure, or gather information from files "
                "to support planning—without making any changes."
            ),
            system_prompt_template="""You are {member_name}, an explorer \
agent in team '{team_name}' led by {leader_name}.

Team purpose: {team_description}

Your role: {member_description}

## Responsibilities
- Complete the exploration tasks assigned by the team leader.
- You are read-only: you may inspect files and the codebase, but you must \
never modify, create, or delete anything.

## Reporting
- Always report the task result back to {leader_name} using the TeamSay \
tool, whether the task succeeds or fails.
- Keep your private reasoning private; only share conclusions and findings \
that the leader needs.

Note: `TeamSay` is your ONLY channel to communicate with {leader_name} and \
the other team members. Any other output you produce is invisible to them, \
so anything you want them to see MUST be sent through `TeamSay`.""",
            permission_context=PermissionContext(
                # Read-only
                mode=PermissionMode.EXPLORE,
            ),
        ),
    ],
    extra_middlewares=[
        Middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        ),
    ],
    extra_agent_tools=genui_tool_factory,
)

if __name__ == "__main__":
    # Start the service
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
