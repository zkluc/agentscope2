# AgentScope Web UI — Vue 3 重构计划

## 1. 概述

**目标**: 将 `examples/web_ui/frontend` (React 19 + shadcn/ui) 重构为 Vue 3.5 + Element Plus + Pinia 版本，保持功能完全一致。

**范围**: 完整重构，包含所有页面：聊天、凭据管理、知识库、排期、设置、导览。

**目标目录**: `frontend-vue/`

## 2. 技术选型

| 领域 | 选择 | 版本 |
|---|---|---|
| 框架 | Vue 3 | 3.5+ |
| 构建工具 | Vite | 8.x |
| 语言 | TypeScript | 5.x |
| 路由 | vue-router | 4.x |
| 状态管理 | Pinia | 3.x |
| UI 组件库 | Element Plus | 2.x |
| 样式方案 | Tailwind CSS v4 + Element Plus 主题覆盖 | 4.x |
| 国际化 | vue-i18n | 10.x |
| Markdown | vue-markdown-render + rehype-highlight | — |
| 动画 | @vueuse/motion + 内置 `<Transition>` | — |
| 可调面板 | splitpanes | 3.x |
| Diff 查看 | diff2html | 3.x |
| 日历 | Element Plus ElCalendar/ElDatePicker | — |
| 图标 | lucide-vue-next | 0.5.x |
| 主题切换 | @vueuse/core useDark | 11.x |
| 通知/Toast | Element Plus ElMessage/ElNotification | — |
| SVG 组件 | vite-svg-loader | 5.x |
| CSS 工具 | tailwind-merge, clsx, class-variance-authority | — |

## 3. 文件结构

```
frontend-vue/
├── public/
│   └── agentscope.svg
├── src/
│   ├── api/                    # 纯 TS 不变（仅 client.ts 改 toast → ElMessage）
│   │   ├── client.ts
│   │   ├── types.ts
│   │   ├── agent.ts
│   │   ├── chat.ts
│   │   ├── credential.ts
│   │   ├── index.ts
│   │   ├── knowledgeBase.ts
│   │   ├── model.ts
│   │   ├── schedule.ts
│   │   ├── session.ts
│   │   └── workspace.ts
│   ├── assets/
│   │   └── agentscope.svg
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatContent.vue
│   │   │   ├── ConfirmCard.vue
│   │   │   ├── Empty.vue
│   │   │   ├── FileAttachment.vue
│   │   │   ├── MessageBubble.vue
│   │   │   ├── SubagentHitlCard.vue
│   │   │   ├── TextInput.vue
│   │   │   └── tool-renderers/
│   │   │       ├── BashRenderer.ts
│   │   │       ├── DefaultRenderer.ts
│   │   │       ├── DiffPreview.vue
│   │   │       ├── EditRenderer.ts
│   │   │       ├── GlobRenderer.ts
│   │   │       ├── GrepRenderer.ts
│   │   │       ├── ReadRenderer.ts
│   │   │       ├── TaskCreateRenderer.ts
│   │   │       ├── WriteRenderer.ts
│   │   │       ├── _shared.ts
│   │   │       ├── index.ts
│   │   │       └── types.ts
│   │   ├── dialog/
│   │   │   ├── AgentDetailDialog.vue
│   │   │   ├── CreateAgentDialog.vue
│   │   │   ├── CreateModelDialog.vue
│   │   │   └── ModelDetailDialog.vue
│   │   ├── drawer/
│   │   │   ├── AgentListDrawer.vue
│   │   │   ├── ModelListDrawer.vue
│   │   │   ├── SessionListDrawer.vue
│   │   │   └── SkillListDrawer.vue
│   │   ├── error/
│   │   │   └── RouteError.vue
│   │   ├── form/
│   │   │   ├── SchemaForm.vue
│   │   │   └── FormField.vue
│   │   ├── knowledge/
│   │   │   ├── KnowledgeConfiguration.vue
│   │   │   ├── KnowledgeDocuments.vue
│   │   │   └── KnowledgeSearch.vue
│   │   ├── layout/
│   │   │   ├── AppLayout.vue
│   │   │   └── AppSidebar.vue
│   │   ├── panel/
│   │   │   └── PanelDock.vue
│   │   ├── popover/
│   │   │   └── UserMenuPopover.vue
│   │   ├── select/
│   │   │   └── AgentSelector.vue
│   │   ├── team/
│   │   │   └── TeamMemberSelector.vue
│   │   └── tour/
│   │       └── TourCard.vue
│   ├── composables/
│   │   ├── useAgentSchema.ts
│   │   ├── useAgents.ts
│   │   ├── useAudio.ts           # AudioContext → provide/inject
│   │   ├── useAvailableModels.ts
│   │   ├── useAvailableTTSModels.ts
│   │   ├── useChat.ts
│   │   ├── useCredentials.ts
│   │   ├── useDocumentStatusPolling.ts
│   │   ├── useKbEmbeddingModels.ts
│   │   ├── useKnowledgeBaseMiddlewareSchema.ts
│   │   ├── useKnowledgeBases.ts
│   │   ├── useKnowledgeDocuments.ts
│   │   ├── useKnowledgeSupportedContentTypes.ts
│   │   ├── useMessages.ts
│   │   ├── useMobile.ts
│   │   ├── useModels.ts
│   │   ├── useSchedules.ts
│   │   ├── useSessions.ts
│   │   ├── useSkills.ts
│   │   └── useWorkspace.ts
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   └── zh.json
│   │   └── useI18n.ts
│   ├── lib/
│   │   └── utils.ts              # cn() tailwind-merge
│   ├── router/
│   │   └── index.ts              # vue-router 配置
│   ├── stores/
│   │   ├── app.ts                # 应用全局状态
│   │   ├── theme.ts              # 主题 (dark/light)
│   │   └── user.ts               # 用户信息
│   ├── types/
│   │   └── unidiff.d.ts
│   ├── utils/
│   │   ├── common.ts
│   │   ├── platform.ts
│   │   └── streamingAudio.ts
│   ├── views/
│   │   ├── chat/
│   │   │   ├── ChatViewport.vue
│   │   │   └── index.vue
│   │   ├── credential/
│   │   │   └── index.vue
│   │   ├── knowledge/
│   │   │   └── index.vue
│   │   ├── schedule/
│   │   │   ├── CalendarTabPage.vue
│   │   │   ├── CreateScheduleDialog.vue
│   │   │   ├── EmptyState.vue
│   │   │   ├── Event.vue
│   │   │   ├── index.vue
│   │   │   ├── ListTabPage.vue
│   │   │   ├── ScheduleCard.vue
│   │   │   ├── ScheduleDetailDrawer.vue
│   │   │   └── ScheduleUtils.ts
│   │   └── setup/
│   │       └── index.vue
│   ├── App.vue
│   ├── index.css                 # Tailwind v4 + 主题 CSS 变量 (与原版一致)
│   ├── main.ts
│   └── vite-env.d.ts
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 4. Element Plus 组件映射

| 当前 shadcn 组件 | Element Plus 替代 |
|---|---|
| `Button`, `Badge`, `Card` | `ElButton`, `ElBadge`, `ElCard` |
| `Dialog`, `Drawer` | `ElDialog`, `ElDrawer` |
| `Popover`, `Tooltip` | `ElPopover`, `ElTooltip` |
| `Select`, `Tabs` | `ElSelect`, `ElTabs` |
| `Calendar`, `DatePicker` | `ElCalendar`, `ElDatePicker` |
| `Input`, `Textarea` | `ElInput` |
| `Switch`, `Slider` | `ElSwitch`, `ElSlider` |
| `Collapsible`, `Accordion` | `ElCollapse` |
| `Separator`, `Divider` | `ElDivider` |
| `Progress` | `ElProgress` |
| `Avatar` | `ElAvatar` |
| `Toast` / `Sonner` | `ElMessage` / `ElNotification` |
| `DropdownMenu` | `ElDropdown` |
| `Form` + SchemaForm | `ElForm` + 自定义 SchemaForm |
| `ScrollArea` | `ElScrollbar` |
| `Table` | `ElTable` (备用) |
| `Sidebar` (自定义) | 自定义布局 + Tailwind |
| `Resizable` | splitpanes |

## 5. 样式策略

- **`index.css`**: 完全保留原版 Tailwind v4 指令 + CSS 变量 (`:root` / `.dark`)
- **Element Plus 主题**:
  - 通过 `ElConfigProvider` 包裹全局组件
  - 覆盖 Element Plus 的 CSS 变量以匹配原版主题色: `--el-color-primary`, `--el-bg-color` 等
  - 通过 `@vueuse/core` `useDark` + `useToggle` 同步 `.dark` class
- **Tailwind 类名**: 继续用于布局、间距、排版等原子样式

## 6. 核心迁移模式

### 6.1 Hooks → Composables
```ts
// React
const [data, setData] = useState<T[]>([])
const [loading, setLoading] = useState(false)
useEffect(() => { fetchData() }, [])

// Vue
const data = ref<T[]>([])
const loading = ref(false)
onMounted(() => fetchData())
```

### 6.2 Context → Pinia + provide/inject
- **`AudioContext`** → `composables/useAudio.ts` (provide/inject)
- **`UploadContext`** → `composables/useUpload.ts` (reducer → ref + watch)
- **全局状态** (username, server_url) → `stores/user.ts` (Pinia)

### 6.3 SSE 流 (useMessages)
- `useEffect` 生命周期 → `watch([agentId, sessionId])` + `onCleanup`
- `requestAnimationFrame` 批处理 → Vue `nextTick` 原生批处理
- `useRef` 可变引用 → 普通变量 + `watch` 同步

## 7. 实施顺序 (10 个 Phase)

| 阶段 | 内容 | 预计天数 |
|---|---|---|
| **Phase 1** | 脚手架搭建: Vite + Vue 3.5 + TS + vue-router + Pinia + Element Plus + Tailwind v4 | 1 |
| **Phase 2** | 样式系统: 移植 index.css + Element Plus 主题覆盖 | 1 |
| **Phase 3** | API 层 + Pinia Stores: 迁移 api/ + 创建 stores | 1 |
| **Phase 4** | Composables: 19 个 hooks 迁移 | 2 |
| **Phase 5** | Element Plus 组件替换: 32 个 shadcn 基元 | 3 |
| **Phase 6** | 布局 + 侧边栏: AppLayout, AppSidebar, PanelDock | 2 |
| **Phase 7** | 业务组件: Chat, Form, Knowledge | 4 |
| **Phase 8** | 页面组件: 5 个路由页面 | 2 |
| **Phase 9** | 工具渲染器: ToolRenderer VNode 适配 | 1 |
| **Phase 10** | 导览 + 集成测试 | 2 |
| **总计** | | **~19 天** |

## 8. 可以不变的文件 (20 个)

```
api/client.ts           → 仅改 toast 导入
api/types.ts            → 完全不变
api/session.ts          → 完全不变
api/chat.ts             → 完全不变
api/agent.ts            → 完全不变
api/credential.ts       → 完全不变
api/model.ts            → 完全不变
api/knowledgeBase.ts    → 完全不变
api/schedule.ts         → 完全不变
api/workspace.ts        → 完全不变
api/index.ts            → 完全不变
utils/common.ts         → 完全不变
utils/platform.ts       → 完全不变
utils/streamingAudio.ts → 完全不变
i18n/locales/en.json    → 完全不变
i18n/locales/zh.json    → 完全不变
assets/agentscope.svg   → 完全不变
index.css               → 完全不变 (Tailwind v4)
types/unidiff.d.ts      → 完全不变
```
