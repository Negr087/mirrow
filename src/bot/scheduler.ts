
import { fetchInstagramPosts } from './instagram-scraper';
import { publishInstagramPostToNostr } from './nostr-publisher';

interface BotConfig {
  instagramAccounts: string[];
  checkIntervalMinutes: number;
  nostrPrivateKey: string; // Hex private key
  relays: string[];
}

const STORAGE_KEY = 'instagram-nostr-bot-config';
const PROCESSED_POSTS_KEY = 'instagram-nostr-bot-processed-posts';

let intervalId: number | undefined;
let processedPostIds: Set<string> = new Set(JSON.parse(localStorage.getItem(PROCESSED_POSTS_KEY) || '[]'));

function saveProcessedPostIds() {
  localStorage.setItem(PROCESSED_POSTS_KEY, JSON.stringify(Array.from(processedPostIds)));
}

export function getBotConfig(): BotConfig {
  const storedConfig = localStorage.getItem(STORAGE_KEY);
  return storedConfig ? JSON.parse(storedConfig) : { instagramAccounts: [], checkIntervalMinutes: 30, nostrPrivateKey: '', relays: ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol'] };
}

export function setBotConfig(config: BotConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  // If the config changes while running, stop and restart the bot
  if (intervalId) {
    stopBot();
    startBot();
  }
}

async function runBotLogic() {
  console.log('Running Instagram to Nostr bot logic...');
  const config = getBotConfig();

  if (!config.nostrPrivateKey) {
    console.warn('Nostr private key not configured. Bot will not publish.');
    return;
  }

  if (config.instagramAccounts.length === 0) {
    console.warn('No Instagram accounts configured. Bot will not fetch posts.');
    return;
  }

  const newPosts = await fetchInstagramPosts(config.instagramAccounts);

  for (const post of newPosts) {
    if (!processedPostIds.has(post.originalLink)) {
      console.log('New post detected:', post.originalLink);
      try {
        await publishInstagramPostToNostr(config.nostrPrivateKey, post);
        processedPostIds.add(post.originalLink);
      } catch (error) {
        console.error('Error publishing post to Nostr:', error);
      }
    }
  }
  saveProcessedPostIds();
}

export function startBot() {
  if (intervalId) {
    console.log('Bot is already running.');
    return;
  }
  const config = getBotConfig();
  const intervalMs = config.checkIntervalMinutes * 60 * 1000;
  console.log(`Starting bot with interval: ${config.checkIntervalMinutes} minutes`);
  // Run immediately and then at intervals
  runBotLogic();
  intervalId = window.setInterval(runBotLogic, intervalMs);
}

export function stopBot() {
  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = undefined;
    console.log('Bot stopped.');
  }
}
