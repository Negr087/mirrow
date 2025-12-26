import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBotConfig, setBotConfig, startBot, stopBot, botEventDispatcher, getBotStatus, initAutoStart, BotStatus, BotLogMessage } from '@/bot/scheduler';

export function InstagramNostrBotConfig() {
  const [instagramAccounts, setInstagramAccounts] = useState('');
  const [checkIntervalMinutes, setCheckIntervalMinutes] = useState(30);
  const [nostrPrivateKey, setNostrPrivateKey] = useState('');
  const [relays, setRelays] = useState('');
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [botStatus, setBotStatus] = useState<BotStatus>({
  isRunning: false,
  lastCheckTime: null,
  lastPostCount: 0,
  error: null
});
  const [botLogs, setBotLogs] = useState<BotLogMessage[]>([]);

  useEffect(() => {
  const config = getBotConfig();
  setInstagramAccounts(config.instagramAccounts.join('\n'));
  setCheckIntervalMinutes(config.checkIntervalMinutes);
  setNostrPrivateKey(config.nostrPrivateKey);
  setRelays(config.relays.join('\n'));

  const seenLogs = new Set<string>();

  const handleBotEvent = (type: 'status' | 'log', payload: BotStatus | BotLogMessage) => {
    if (type === 'status') {
      setBotStatus(payload as BotStatus);
      setIsBotRunning((payload as BotStatus).isRunning);
    } else if (type === 'log') {
      const log = payload as BotLogMessage;
      const logKey = `${log.timestamp}-${log.message}`;
      
      // Only add if we haven't seen this log before
      if (!seenLogs.has(logKey)) {
        seenLogs.add(logKey);
        setBotLogs(prevLogs => [...prevLogs, log]);
      }
    }
  };

  botEventDispatcher.addListener(handleBotEvent);

  // Initial status update and auto-start
  getBotStatus().then(status => {
    setBotStatus(status);
    setIsBotRunning(status.isRunning);
  });
  
  initAutoStart();

  return () => {
    botEventDispatcher.removeListener(handleBotEvent);
  };
}, []);

  const handleSaveConfig = () => {
    const config = {
      instagramAccounts: instagramAccounts.split('\n').map(s => s.trim()).filter(s => s.length > 0),
      checkIntervalMinutes: Number(checkIntervalMinutes),
      nostrPrivateKey,
      relays: relays.split('\n').map(s => s.trim()).filter(s => s.length > 0),
    };
    setBotConfig(config);
    alert('Configuration saved!');
  };

  const handleStartBot = () => {
    handleSaveConfig(); // Save config before starting
    startBot();
  };

  const handleStopBot = () => {
    stopBot();
  };

  const getLogLevelColor = (level: BotLogMessage['level']) => {
    switch (level) {
      case 'info': return 'text-blue-500';
      case 'warn': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-700';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Instagram to Nostr Bot Configuration</CardTitle>
        <CardDescription>Configure your bot to mirror Instagram posts to Nostr.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="instagramAccounts">Instagram Public Account Usernames (one per line)</Label>
          <Textarea
            id="instagramAccounts"
            placeholder="username1\nusername2"
            value={instagramAccounts}
            onChange={(e) => setInstagramAccounts(e.target.value)}
            rows={5}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="checkInterval">Check Interval (minutes)</Label>
          <Input
            id="checkInterval"
            type="number"
            value={checkIntervalMinutes}
            onChange={(e) => setCheckIntervalMinutes(Number(e.target.value))}
            min="1"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nostrPrivateKey">Nostr Private Key (nsec or hex)</Label>
          <Input
            id="nostrPrivateKey"
            type="password"
            placeholder="nsec1... or hex private key"
            value={nostrPrivateKey}
            onChange={(e) => setNostrPrivateKey(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-red-500">Warning:</span> Storing your private key directly in local storage is not recommended for production. For better security, consider using a NIP-07 signer or an encrypted key management solution.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="relays">Nostr Relays (one URL per line)</Label>
          <Textarea
            id="relays"
            placeholder="wss://relay.damus.io\nwss://relay.nostr.band"
            value={relays}
            onChange={(e) => setRelays(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button onClick={handleSaveConfig}>Save Configuration</Button>
          {isBotRunning ? (
            <Button variant="destructive" onClick={handleStopBot}>Stop Bot</Button>
          ) : (
            <Button onClick={handleStartBot}>Start Bot</Button>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2">Bot Status</h3>
          <p><strong>Running:</strong> {botStatus.isRunning ? 'Yes' : 'No'}</p>
          <p><strong>Last Check:</strong> {botStatus.lastCheckTime || 'N/A'}</p>
          <p><strong>New Posts Published (last run):</strong> {botStatus.lastPostCount}</p>
          {botStatus.error && <p className="text-red-500"><strong>Error:</strong> {botStatus.error}</p>}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2">Bot Logs</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md h-60 overflow-y-auto font-mono text-sm">
            {botLogs.length === 0 ? (
              <p className="text-gray-500">No logs yet.</p>
            ) : (
              botLogs.map((log, index) => (
                <p key={index} className={`${getLogLevelColor(log.level)}`}>
                  [{log.timestamp}] [{log.level.toUpperCase()}] {log.message}
                </p>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}