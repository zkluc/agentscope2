"""
GenUI API 示例
演示如何在后端生成 GenUI schema 并返回给前端
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from typing import Dict, Any, List

app = Flask(__name__)
CORS(app)


def should_generate_ui(user_message: str) -> bool:
    """判断是否需要生成 UI"""
    ui_keywords = [
        "生成界面", "创建表单", "显示图表", "UI", "界面", "表单", 
        "图表", "按钮", "输入框", "表格", "列表", "卡片", "生成", 
        "创建", "显示", "调查问卷", "登录", "注册", "搜索"
    ]
    
    lower_message = user_message.lower()
    return any(keyword in lower_message for keyword in ui_keywords)


def generate_login_form_schema() -> Dict[str, Any]:
    """生成登录表单的 GenUI schema"""
    return {
        "componentName": "Page",
        "props": {
            "style": {
                "padding": "20px",
                "maxWidth": "400px",
                "margin": "0 auto"
            }
        },
        "children": [
            {
                "componentName": "Text",
                "props": {
                    "text": "用户登录",
                    "style": {
                        "fontSize": "24px",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "marginBottom": "20px"
                    }
                }
            },
            {
                "componentName": "Form",
                "props": {
                    "labelWidth": "80px"
                },
                "children": [
                    {
                        "componentName": "FormItem",
                        "props": {
                            "label": "用户名"
                        },
                        "children": [
                            {
                                "componentName": "Input",
                                "props": {
                                    "placeholder": "请输入用户名",
                                    "prefixIcon": "User"
                                }
                            }
                        ]
                    },
                    {
                        "componentName": "FormItem",
                        "props": {
                            "label": "密码"
                        },
                        "children": [
                            {
                                "componentName": "Input",
                                "props": {
                                    "type": "password",
                                    "placeholder": "请输入密码",
                                    "prefixIcon": "Lock"
                                }
                            }
                        ]
                    },
                    {
                        "componentName": "FormItem",
                        "children": [
                            {
                                "componentName": "Button",
                                "props": {
                                    "type": "primary",
                                    "text": "登录",
                                    "style": {
                                        "width": "100%"
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }


def generate_survey_form_schema() -> Dict[str, Any]:
    """生成调查问卷的 GenUI schema"""
    return {
        "componentName": "Page",
        "props": {
            "style": {
                "padding": "20px",
                "maxWidth": "600px",
                "margin": "0 auto"
            }
        },
        "children": [
            {
                "componentName": "Text",
                "props": {
                    "text": "用户满意度调查",
                    "style": {
                        "fontSize": "24px",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "marginBottom": "20px"
                    }
                }
            },
            {
                "componentName": "Form",
                "props": {
                    "labelWidth": "120px"
                },
                "children": [
                    {
                        "componentName": "FormItem",
                        "props": {
                            "label": "您的姓名"
                        },
                        "children": [
                            {
                                "componentName": "Input",
                                "props": {
                                    "placeholder": "请输入您的姓名"
                                }
                            }
                        ]
                    },
                    {
                        "componentName": "FormItem",
                        "props": {
                            "label": "您的邮箱"
                        },
                        "children": [
                            {
                                "componentName": "Input",
                                "props": {
                                    "placeholder": "请输入您的邮箱",
                                    "type": "email"
                                }
                            }
                        ]
                    },
                    {
                        "componentName": "FormItem",
                        "props": {
                            "label": "满意度评分"
                        },
                        "children": [
                            {
                                "componentName": "Rate",
                                "props": {
                                    "allowHalf": True
                                }
                            }
                        ]
                    },
                    {
                        "componentName": "FormItem",
                        "props": {
                            "label": "改进建议"
                        },
                        "children": [
                            {
                                "componentName": "Input",
                                "props": {
                                    "type": "textarea",
                                    "rows": 4,
                                    "placeholder": "请提供您的改进建议..."
                                }
                            }
                        ]
                    },
                    {
                        "componentName": "FormItem",
                        "children": [
                            {
                                "componentName": "Button",
                                "props": {
                                    "type": "primary",
                                    "text": "提交问卷",
                                    "style": {
                                        "width": "100%"
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }


def generate_data_table_schema() -> Dict[str, Any]:
    """生成数据表格的 GenUI schema"""
    return {
        "componentName": "Page",
        "props": {
            "style": {
                "padding": "20px"
            }
        },
        "children": [
            {
                "componentName": "Text",
                "props": {
                    "text": "用户数据列表",
                    "style": {
                        "fontSize": "20px",
                        "fontWeight": "bold",
                        "marginBottom": "16px"
                    }
                }
            },
            {
                "componentName": "Table",
                "props": {
                    "data": [
                        {"id": 1, "name": "张三", "email": "zhangsan@example.com", "status": "活跃"},
                        {"id": 2, "name": "李四", "email": "lisi@example.com", "status": " inactive"},
                        {"id": 3, "name": "王五", "email": "wangwu@example.com", "status": "活跃"}
                    ],
                    "columns": [
                        {"prop": "id", "label": "ID", "width": "80"},
                        {"prop": "name", "label": "姓名", "width": "120"},
                        {"prop": "email", "label": "邮箱", "width": "200"},
                        {"prop": "status", "label": "状态", "width": "100"}
                    ],
                    "border": True,
                    "stripe": True
                }
            }
        ]
    }


def generate_ui_schema(user_message: str) -> Dict[str, Any]:
    """根据用户消息生成对应的 UI schema"""
    lower_message = user_message.lower()
    
    if any(keyword in lower_message for keyword in ["登录", "login", "账号"]):
        return generate_login_form_schema()
    elif any(keyword in lower_message for keyword in ["调查", "问卷", "survey"]):
        return generate_survey_form_schema()
    elif any(keyword in lower_message for keyword in ["表格", "数据", "列表", "table"]):
        return generate_data_table_schema()
    else:
        # 默认生成一个简单的表单
        return {
            "componentName": "Page",
            "props": {
                "style": {
                    "padding": "20px"
                }
            },
            "children": [
                {
                    "componentName": "Text",
                    "props": {
                        "text": "AI 生成的界面",
                        "style": {
                            "fontSize": "20px",
                            "fontWeight": "bold",
                            "marginBottom": "16px"
                        }
                    }
                },
                {
                    "componentName": "Form",
                    "children": [
                        {
                            "componentName": "FormItem",
                            "props": {
                                "label": "输入框"
                            },
                            "children": [
                                {
                                    "componentName": "Input",
                                    "props": {
                                        "placeholder": "请输入内容"
                                    }
                                }
                            ]
                        },
                        {
                            "componentName": "FormItem",
                            "children": [
                                {
                                    "componentName": "Button",
                                    "props": {
                                        "type": "primary",
                                        "text": "提交"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }


@app.route('/api/chat', methods=['POST'])
def chat():
    """聊天 API 端点"""
    data = request.json
    user_message = data.get('message', '')
    
    # 判断是否需要生成 UI
    if should_generate_ui(user_message):
        # 生成 GenUI schema
        schema = generate_ui_schema(user_message)
        return jsonify({
            'type': 'genui',
            'schema': schema,
            'content': [{'type': 'text', 'text': '为您生成了以下界面：'}]
        })
    else:
        # 普通文本回复
        response_text = f"您说的是：{user_message}\n\n如果您需要生成界面，请告诉我您想要什么类型的界面，例如：\n- 登录表单\n- 调查问卷\n- 数据表格"
        return jsonify({
            'type': 'text',
            'content': [{'type': 'text', 'text': response_text}]
        })


@app.route('/api/genui/stream', methods=['POST'])
def genui_stream():
    """流式 GenUI API 端点（用于实时生成）"""
    data = request.json
    user_message = data.get('message', '')
    
    # 这里应该调用 LLM 来流式生成 schema
    # 这里只是示例，返回一个简单的 schema
    schema = generate_ui_schema(user_message)
    
    return jsonify({
        'type': 'genui',
        'schema': schema,
        'content': [{'type': 'text', 'text': '为您生成了以下界面：'}]
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
