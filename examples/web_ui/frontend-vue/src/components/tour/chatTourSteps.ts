export const CHAT_TOUR_NAME = 'chat-onboarding';

type TFunction = (key: string, params?: Record<string, unknown>) => string;

export interface TourStep {
  icon: null;
  title: string;
  content: string;
  selector: string;
  side: string;
  showControls: boolean;
  pointerPadding: number;
  pointerRadius: number;
}

export const buildChatTour = (t: TFunction): TourStep[] => [
  {
    icon: null,
    title: t('tour.createAgent.title'),
    content: t('tour.createAgent.content'),
    selector: '#tour-create-agent',
    side: 'bottom',
    showControls: false,
    pointerPadding: 8,
    pointerRadius: 8,
  },
  {
    icon: null,
    title: t('tour.createSession.title'),
    content: t('tour.createSession.content'),
    selector: '#tour-create-session',
    side: 'right',
    showControls: false,
    pointerPadding: 6,
    pointerRadius: 6,
  },
  {
    icon: null,
    title: t('tour.llmSelect.title'),
    content: t('tour.llmSelect.content'),
    selector: '#tour-llm-select',
    side: 'bottom',
    showControls: false,
    pointerPadding: 6,
    pointerRadius: 8,
  },
  {
    icon: null,
    title: t('tour.permissionMode.title'),
    content: t('tour.permissionMode.content'),
    selector: '#tour-permission-mode',
    side: 'bottom-right',
    showControls: false,
    pointerPadding: 6,
    pointerRadius: 8,
  },
  {
    icon: null,
    title: t('tour.chatInput.title'),
    content: t('tour.chatInput.content'),
    selector: '#tour-chat-input',
    side: 'top',
    showControls: false,
    pointerPadding: 6,
    pointerRadius: 16,
  },
];
