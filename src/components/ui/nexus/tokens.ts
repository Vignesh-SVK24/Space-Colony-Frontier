export const NEXUS_TOKENS = {
  colors: {
    bg: {
      deepVoid: '#030712',
      darkCharcoal: '#0b0f19',
      glassBase: 'rgba(11, 15, 25, 0.82)',
      glassElevated: 'rgba(15, 23, 42, 0.90)',
      glassHighlight: 'rgba(56, 189, 248, 0.06)'
    },
    borders: {
      subtle: 'rgba(56, 189, 248, 0.18)',
      active: 'rgba(56, 189, 248, 0.55)',
      critical: 'rgba(239, 68, 68, 0.45)',
      warning: 'rgba(245, 158, 11, 0.45)',
      healthy: 'rgba(16, 185, 129, 0.45)'
    },
    accents: {
      cyan: '#38bdf8',
      electricCyan: '#06b6d4',
      coolBlue: '#60a5fa',
      white: '#f8fafc',
      violet: '#a855f7'
    },
    status: {
      healthy: '#10b981',
      warning: '#f59e0b',
      critical: '#ef4444',
      info: '#38bdf8',
      discovery: '#c084fc',
      alien: '#fbbf24'
    }
  },
  typography: {
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  transitions: {
    quick: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  }
} as const;

export type NexusStatusType = 'healthy' | 'warning' | 'critical' | 'info' | 'discovery' | 'alien';
