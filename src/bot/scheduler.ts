
import { fetchInstagramPosts, type InstagramPost } from './instagram-scraper';
import { publishInstagramPostToNostr } from './nostr-publisher';

interface BotConfig {
  instagramAccounts: string[];
  checkIntervalMinutes: number;
  nostrPrivateKey: string; // Hex private key
  relays: string[];
}

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

  public dispatch(type: 'status', payload: BotStatus);
  public dispatch(type: 'log', payload: BotLogMessage);
  public dispatch(type: 'status' | 'log', payload: BotStatus | BotLogMessage) {
    for (const listener of this.listeners) {
      listener(type, payload);
    }
  }
}

export const botEventDispatcher = new BotEventDispatcher();

const STORAGE_KEY = 'instagram-nostr-bot-config';
const PROCESSED_POSTS_KEY = 'instagram-nostr-bot-processed-posts';

let intervalId: number | undefined;
let processedPostIds: Set<string> = new Set(JSON.parse(localStorage.getItem(PROCESSED_POSTS_KEY) || '[]'));
let currentStatus: BotStatus = {
  isRunning: false,
  lastCheckTime: null,
  lastPostCount: 0,
  error: null,
};

function updateStatus(newStatus: Partial<BotStatus>) {
  currentStatus = { ...currentStatus, ...newStatus };
  botEventDispatcher.dispatch('status', currentStatus);
}

function logMessage(level: 'info' | 'warn' | 'error', message: string) {
  const logMsg: BotLogMessage = { timestamp: new Date().toLocaleString(), level, message };
  botEventDispatcher.dispatch('log', logMsg);
}

function saveProcessedPostIds() {
  localStorage.setItem(PROCESSED_POSTS_KEY, JSON.stringify(Array.from(processedPostIds)));
}

export function getBotConfig(): BotConfig {
  const storedConfig = localStorage.getItem(STORAGE_KEY);
  return storedConfig ? JSON.parse(storedConfig) : { instagramAccounts: [], checkIntervalMinutes: 30, nostrPrivateKey: '', relays: ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol'] };
}

export function setBotConfig(config: BotConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  logMessage('info', 'Bot configuration saved.');
  // If the config changes while running, stop and restart the bot
  if (intervalId) {
    stopBot();
    startBot();
  }
}

async function runBotLogic() {
  logMessage('info', 'Running Instagram to Nostr bot logic...');
  updateStatus({ lastCheckTime: new Date().toLocaleString(), lastPostCount: 0, error: null });
  const config = getBotConfig();

  if (!config.nostrPrivateKey) {
    logMessage('warn', 'Nostr private key not configured. Bot will not publish.');
    updateStatus({ error: 'Nostr private key not configured.' });
    return;
  }

  if (config.instagramAccounts.length === 0) {
    logMessage('warn', 'No Instagram accounts configured. Bot will not fetch posts.');
    updateStatus({ error: 'No Instagram accounts configured.' });
    return;
  }

  let publishedCount = 0;
  try {
    const newPosts: InstagramPost[] = await fetchInstagramPosts(config.instagramAccounts);

    for (const post of newPosts) {
      if (!processedPostIds.has(post.originalLink)) {
        logMessage('info', `New post detected: ${post.originalLink}`);
        try {
          await publishInstagramPostToNostr(config.nostrPrivateKey, post);
          processedPostIds.add(post.originalLink);
          publishedCount++;
          logMessage('info', `Post published to Nostr: ${post.originalLink}`);
        } catch (error: any) {
          logMessage('error', `Error publishing post to Nostr ${post.originalLink}: ${error.message}`);
          updateStatus({ error: `Error publishing post: ${error.message}` });
        }
      }
    }
    saveProcessedPostIds();
    updateStatus({ lastPostCount: publishedCount, error: null });
    logMessage('info', `Finished checking. Published ${publishedCount} new posts.`);
  } catch (error: any) {
    logMessage('error', `Error during bot execution: ${error.message}`);
    updateStatus({ error: `Bot execution error: ${error.message}` });
  }
}

export function startBot() {
  if (intervalId) {
    logMessage('warn', 'Bot is already running.');
    return;
  }
  updateStatus({ isRunning: true, error: null });
  const config = getBotConfig();
  const intervalMs = config.checkIntervalMinutes * 60 * 1000;
  logMessage('info', `Starting bot with interval: ${config.checkIntervalMinutes} minutes`);
  // Run immediately and then at intervals
  runBotLogic();
  intervalId = window.setInterval(runBotLogic, intervalMs);
}

export function stopBot() {
  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = undefined;
    updateStatus({ isRunning: false, error: null });
    logMessage('info', 'Bot stopped.');
  }
}

export function getBotStatus(): BotStatus {
  return currentStatus;
}
