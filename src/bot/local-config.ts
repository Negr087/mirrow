// src/bot/local-config.ts
const STORAGE_KEY = 'instagram-nostr-bot-config';

interface BotConfig {
  instagramAccounts: string[];
  checkIntervalMinutes: number;
  nostrPrivateKey: string;
  relays: string[];
}

export function getBotConfig(): BotConfig {
  const storedConfig = localStorage.getItem(STORAGE_KEY);
  return storedConfig ? JSON.parse(storedConfig) : {
    instagramAccounts: [],
    checkIntervalMinutes: 30,
    nostrPrivateKey: '',
    relays: ['wss://relay.damus.io', 'wss://nos.lol']
  };
}

export function setBotConfig(config: BotConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}