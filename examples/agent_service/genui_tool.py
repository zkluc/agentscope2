# -*- coding: utf-8 -*-
"""GenUI 工具 - 让 Agent 可以生成 GenUI 界面"""
import json
from typing import Any, Dict, List, Optional
from agentscope.tool import FunctionTool, ToolChunk
from agentscope.message import TextBlock
from agentscope.permission import PermissionDecision, PermissionBehavior


class GenUITool(FunctionTool):
    """GenUI 工具 - 自动允许执行，不需要用户确认"""
    
    async def check_permissions(
        self,
        *_args: Any,
        **_kwargs: Any,
    ) -> PermissionDecision:
        """自动允许 GenUI 工具执行"""
        return PermissionDecision(
            behavior=PermissionBehavior.ALLOW,
            message="GenUI 工具自动允许执行。",
        )


class GenUIgenerator:
    """GenUI 生成器，根据用户需求生成 GenUI schema"""

    @staticmethod
    def _text(text: str, style: str = "") -> Dict[str, Any]:
        node: Dict[str, Any] = {"componentName": "Text", "props": {"text": text}}
        if style:
            node["props"]["style"] = style
        return node

    TEMPLATES = {
        "login": {
            "schema": {
                "componentName": "Page",
                "props": {"style": {"padding": "20px", "maxWidth": "400px", "margin": "0 auto"}},
                "children": [
                    {
                        "componentName": "Text",
                        "props": {
                            "text": "用户登录",
                            "style": {"fontSize": "24px", "fontWeight": "bold", "textAlign": "center", "marginBottom": "20px"}
                        }
                    },
                    {
                        "componentName": "TinyForm",
                        "props": {"model": "loginForm"},
                        "children": [
                            {
                                "componentName": "TinyFormItem",
                                "props": {"label": "用户名", "prop": "username"},
                                "children": [{"componentName": "TinyInput", "props": {"placeholder": "请输入用户名", "prop": "username"}}]
                            },
                            {
                                "componentName": "TinyFormItem",
                                "props": {"label": "密码", "prop": "password"},
                                "children": [{"componentName": "TinyInput", "props": {"type": "password", "placeholder": "请输入密码", "prop": "password"}}]
                            },
                            {
                                "componentName": "TinyFormItem",
                                "children": [{"componentName": "TinyButton", "props": {"type": "primary", "text": "登录", "style": {"width": "100%"}}}]
                            }
                        ]
                    }
                ]
            }
        },
        "survey": {
            "schema": {
                "componentName": "Page",
                "props": {"style": {"padding": "20px", "maxWidth": "600px", "margin": "0 auto"}},
                "children": [
                    {
                        "componentName": "Text",
                        "props": {
                            "text": "用户满意度调查",
                            "style": {"fontSize": "24px", "fontWeight": "bold", "textAlign": "center", "marginBottom": "20px"}
                        }
                    },
                    {
                        "componentName": "TinyForm",
                        "props": {"model": "surveyForm"},
                        "children": [
                            {
                                "componentName": "TinyFormItem",
                                "props": {"label": "您的姓名", "prop": "name"},
                                "children": [{"componentName": "TinyInput", "props": {"placeholder": "请输入您的姓名", "prop": "name"}}]
                            },
                            {
                                "componentName": "TinyFormItem",
                                "props": {"label": "满意度评分", "prop": "score"},
                                "children": [{"componentName": "TinyNumeric", "props": {"min": 0, "max": 5, "step": 0.5, "modelValue": 0, "prop": "score"}}]
                            },
                            {
                                "componentName": "TinyFormItem",
                                "props": {"label": "改进建议", "prop": "suggestion"},
                                "children": [{"componentName": "TinyInput", "props": {"type": "textarea", "rows": 4, "placeholder": "请提供您的改进建议...", "prop": "suggestion"}}]
                            },
                            {
                                "componentName": "TinyFormItem",
                                "children": [{"componentName": "TinyButton", "props": {"type": "primary", "text": "提交问卷", "style": {"width": "100%"}}}]
                            }
                        ]
                    }
                ]
            }
        },
        "table": {
            "schema": {
                "componentName": "Page",
                "props": {"style": {"padding": "20px"}},
                "children": [
                    {
                        "componentName": "Text",
                        "props": {
                            "text": "数据列表",
                            "style": {"fontSize": "20px", "fontWeight": "bold", "marginBottom": "16px"}
                        }
                    },
                    {
                        "componentName": "div",
                        "props": {"style": {"overflowX": "auto"}},
                        "children": [
                            {
                                "componentName": "table",
                                "props": {"style": {"width": "100%", "borderCollapse": "collapse"}},
                                "children": [
                                    {
                                        "componentName": "thead",
                                        "children": [{
                                            "componentName": "tr",
                                            "children": [
                                                {"componentName": "th", "props": {"style": {"border": "1px solid #ddd", "padding": "8px", "background": "#f5f5f5"}}},
                                                {"componentName": "th", "props": {"style": {"border": "1px solid #ddd", "padding": "8px", "background": "#f5f5f5"}}},
                                                {"componentName": "th", "props": {"style": {"border": "1px solid #ddd", "padding": "8px", "background": "#f5f5f5"}}}
                                            ]
                                        }]
                                    },
                                    {
                                        "componentName": "tbody",
                                        "children": [
                                            {"componentName": "tr", "children": [
                                                {"componentName": "td", "props": {"style": {"border": "1px solid #ddd", "padding": "8px"}}},
                                                {"componentName": "td", "props": {"style": {"border": "1px solid #ddd", "padding": "8px"}}},
                                                {"componentName": "td", "props": {"style": {"border": "1px solid #ddd", "padding": "8px"}}}
                                            ]},
                                            {"componentName": "tr", "children": [
                                                {"componentName": "td", "props": {"style": {"border": "1px solid #ddd", "padding": "8px"}}},
                                                {"componentName": "td", "props": {"style": {"border": "1px solid #ddd", "padding": "8px"}}},
                                                {"componentName": "td", "props": {"style": {"border": "1px solid #ddd", "padding": "8px"}}}
                                            ]}
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }
    }

    @classmethod
    def detect_template(cls, user_message: str) -> Optional[str]:
        lower_msg = user_message.lower()
        if any(kw in lower_msg for kw in ["登录", "login", "账号", "注册"]):
            return "login"
        elif any(kw in lower_msg for kw in ["调查", "问卷", "survey", "满意度"]):
            return "survey"
        elif any(kw in lower_msg for kw in ["表格", "数据", "列表", "table"]):
            return "table"
        return None

    @classmethod
    def generate_custom_form(cls, user_message: str) -> Dict[str, Any]:
        return {
            "schema": {
                "componentName": "Page",
                "props": {"style": {"padding": "20px"}},
                "children": [
                    {
                        "componentName": "Text",
                        "props": {
                            "text": "根据您的需求生成的界面",
                            "style": {"fontSize": "20px", "fontWeight": "bold", "textAlign": "center", "marginBottom": "20px"}
                        }
                    },
                    {
                        "componentName": "TinyForm",
                        "props": {"model": "customForm"},
                        "children": [
                            {
                                "componentName": "TinyFormItem",
                                "props": {"label": "输入框", "prop": "input1"},
                                "children": [{"componentName": "TinyInput", "props": {"placeholder": "请输入内容", "prop": "input1"}}]
                            },
                            {
                                "componentName": "TinyFormItem",
                                "children": [{"componentName": "TinyButton", "props": {"type": "primary", "text": "提交"}}]
                            }
                        ]
                    }
                ]
            }
        }


def generate_genui(user_message: str) -> str:
    """
    根据用户消息生成 GenUI 界面
    """
    template_name = GenUIgenerator.detect_template(user_message)

    if template_name:
        template = GenUIgenerator.TEMPLATES[template_name]
        schema = template["schema"]
    else:
        custom = GenUIgenerator.generate_custom_form(user_message)
        schema = custom["schema"]

    response = {
        "type": "genui",
        "schema": schema,
        "message": "为您生成了以下界面："
    }

    return json.dumps(response, ensure_ascii=False)


genui_tool = GenUITool(
    func=generate_genui,
    name="generate_genui",
    description="Generate interactive UI components (forms, tables, surveys, dashboards). "
    "Call this tool when the user wants to create, build, or display any user interface. "
    "支持：登录表单、调查问卷、数据表格、自定义表单等。"
    "当用户要求生成界面、表单、问卷、表格、UI时，必须使用此工具。",
    is_read_only=True,
)
