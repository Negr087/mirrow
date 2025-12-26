// src/bot/scheduler.ts
import { getBotConfig as getLocalConfig, setBotConfig as setLocalConfig } from './local-config';

const BACKEND_URL = 'https://instagram-nostr-backend-production.up.railway.app';

export interface BotStatus {
  isRunning: boolean;
  lastCheckTime: string | null;
  lastPostCount: number;
  error: string | null;
}

export interface BotLogMessage {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

type BotEventListener = (type: 'status' | 'log', payload: BotStatus | BotLogMessage) => void;

class BotEventDispatcher {
  private listeners: BotEventListener[] = [];

  public addListener(listener: BotEventListener) {
    this.listeners.push(listener);
  }

  public removeListener(listener: BotEventListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public dispatch(type: 'status', payload: BotStatus): void;
  public dispatch(type: 'log', payload: BotLogMessage): void;
  public dispatch(type: 'status' | 'log', payload: BotStatus | BotLogMessage): void {
    for (const listener of this.listeners) {
      listener(type, payload);
    }
  }
}

export const botEventDispatcher = new BotEventDispatcher();

let pollInterval: number | undefined;

// Poll backend for status and logs
function startPolling() {
  if (pollInterval) return;
  
  pollInterval = window.setInterval(async () => {
    try {
      // Get status
      const statusResponse = await fetch(`${BACKEND_URL}/api/bot/status`);
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        botEventDispatcher.dispatch('status', status);
      }
      
      // Get logs
      const logsResponse = await fetch(`${BACKEND_URL}/api/bot/logs`);
      if (logsResponse.ok) {
        const { logs } = await logsResponse.json();
        // Only dispatch new logs
        logs.forEach((log: BotLogMessage) => {
          botEventDispatcher.dispatch('log', log);
        });
      }
    } catch (error) {
      console.error('Error polling backend:', error);
    }
  }, 2000); // Poll every 2 seconds
}

function stopPolling() {
  if (pollInterval) {
    window.clearInterval(pollInterval);
    pollInterval = undefined;
  }
}

export function getBotConfig() {
  return getLocalConfig();
}

export async function setBotConfig(config: any) {
  // Save locally
  setLocalConfig(config);
  
  // Send to backend
  try {
    const response = await fetch(`${BACKEND_URL}/api/bot/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save config to backend');
    }
  } catch (error) {
    console.error('Error saving config to backend:', error);
    throw error;
  }
}

export async function startBot() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/bot/start`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to start bot');
    }
    
    startPolling();
  } catch (error) {
    console.error('Error starting bot:', error);
    throw error;
  }
}

export async function stopBot() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/bot/stop`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to stop bot');
    }
    
    stopPolling();
  } catch (error) {
    console.error('Error stopping bot:', error);
    throw error;
  }
}

export async function getBotStatus(): Promise<BotStatus> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/bot/status`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error getting bot status:', error);
  }
  
  return {
    isRunning: false,
    lastCheckTime: null,
    lastPostCount: 0,
    error: null
  };
}

export function initAutoStart() {
  // Start polling when page loads
  startPolling();
}