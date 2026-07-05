export interface ParsedCron {
  time: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  weekday?: number;
  dayOfMonth?: number;
  date?: Date;
}

export function parseCronExpression(cron: string, startedAt: string): ParsedCron {
  const parts = cron.trim().split(/\s+/);
  const [minute, hour, dom, month, dow] = parts;

  const pad = (n: number) => String(n).padStart(2, '0');
  const time = `${pad(Number(hour ?? 0))}:${pad(Number(minute ?? 0))}`;
  const start = startedAt ? new Date(startedAt) : new Date();

  if (dom === '*' && dow === '*' && month === '*') {
    return { time, frequency: 'daily' };
  }
  if (dom === '*' && dow !== '*' && dow !== '*' && month === '*') {
    return { time, frequency: 'weekly', weekday: Number(dow) };
  }
  if (dom !== '*' && dom !== '*' && dow === '*' && month === '*') {
    return { time, frequency: 'monthly', dayOfMonth: Number(dom) };
  }
  // Check if it's a "once" expression: m h d month *
  if (dom !== '*' && month !== '*' && dow === '*') {
    const date = new Date(Number(month) < 13 ? start.getFullYear() : start.getFullYear(), Number(month) - 1, Number(dom));
    return { time, frequency: 'once', date };
  }

  return { time, frequency: 'custom' };
}

export function getFrequencyLabel(
  parsed: ParsedCron,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  switch (parsed.frequency) {
    case 'daily':
      return t('schedule.freqDaily');
    case 'weekly': {
      const weekdays = [
        t('schedule.sunday'),
        t('schedule.monday'),
        t('schedule.tuesday'),
        t('schedule.wednesday'),
        t('schedule.thursday'),
        t('schedule.friday'),
        t('schedule.saturday'),
      ];
      return `${t('schedule.freqWeekly')} (${weekdays[parsed.weekday ?? 0]})`;
    }
    case 'monthly':
      return `${t('schedule.freqMonthly')} (${t('schedule.dayOfMonthSuffix')} ${parsed.dayOfMonth ?? 1})`;
    case 'once':
      return t('schedule.freqOnce');
    default:
      return parsed.frequency;
  }
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  content: string;
}
