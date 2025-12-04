
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBotConfig, setBotConfig, startBot, stopBot } from '@/bot/scheduler';

export function InstagramNostrBotConfig() {
  const [instagramAccounts, setInstagramAccounts] = useState('');
  const [checkIntervalMinutes, setCheckIntervalMinutes] = useState(30);
  const [nostrPrivateKey, setNostrPrivateKey] = useState('');
  const [relays, setRelays] = useState('');
  const [isBotRunning, setIsBotRunning] = useState(false);

  useEffect(() => {
    const config = getBotConfig();
    setInstagramAccounts(config.instagramAccounts.join('\n'));
    setCheckIntervalMinutes(config.checkIntervalMinutes);
    setNostrPrivateKey(config.nostrPrivateKey);
    setRelays(config.relays.join('\n'));

    // Check if bot is running based on intervalId (simple check for now)
    // A more robust solution would involve a shared state or service worker
    const running = localStorage.getItem('botRunning') === 'true'; // Using localStorage for a simple state check
    setIsBotRunning(running);
  }, []);

  const handleSaveConfig = () => {
    const config = {
      instagramAccounts: instagramAccounts.split('\n').map(s => s.trim()).filter(s => s.length > 0),
      checkIntervalMinutes: Number(checkIntervalMinutes),
      nostrPrivateKey,
      relays: relays.split('\n').map(s => s.trim()).filter(s => s.length > 0),
    };
    setBotConfig(config);
    localStorage.setItem('botRunning', isBotRunning.toString()); // Update running state in localStorage
    alert('Configuration saved!');
  };

  const handleStartBot = () => {
    handleSaveConfig(); // Save config before starting
    startBot();
    setIsBotRunning(true);
    localStorage.setItem('botRunning', 'true');
  };

  const handleStopBot = () => {
    stopBot();
    setIsBotRunning(false);
    localStorage.setItem('botRunning', 'false');
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
      </CardContent>
    </Card>
  );
}
