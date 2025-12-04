
import { NostrEvent } from '@nostrify/nostrify';
import { createEvent, getPublicKey, finalizeEvent } from 'nostr-tools';
import { uploadFileToBlossom } from '@/lib/upload';
import { SimplePool } from 'nostr-tools';
import { getBotConfig } from './scheduler';

// We need a simple signer interface for BlossomUploader
const createNostrSigner = (privateKeyHex: string) => ({
  getPublicKey: async () => getPublicKey(privateKeyHex),
  signEvent: async (event: any) => {
    // nostr-tools createEvent already finalizes the event if a private key is provided
    // If you were using a NIP-07 extension, you'd call window.nostr.signEvent
    return finalizeEvent(event, privateKeyHex);
  },
  nip44: undefined, // No NIP-44 support for simple private key signer
});

async function fetchImageUrlAsFile(imageUrl: string): Promise<File> {
  // Using a CORS proxy to bypass potential CORS issues in the browser.
  const proxyUrl = `https://proxy.shakespeare.diy/?url=${encodeURIComponent(imageUrl)}`;
  const response = await fetch(proxyUrl);
  const blob = await response.blob();
  // Determine file type. This is a basic guess, can be improved.
  const fileType = blob.type.includes('image') ? blob.type : 'image/jpeg';
  return new File([blob], 'instagram-image.jpg', { type: fileType });
}

export async function publishInstagramPostToNostr(
  privateKeyHex: string,
  post: {
    id: string;
    imageUrl: string;
    text: string;
    originalLink: string;
  },
) {
  const pubkey = getPublicKey(privateKeyHex);
  const signer = createNostrSigner(privateKeyHex);

  // Fetch image and upload to NIP-96 host
  const imageFile = await fetchImageUrlAsFile(post.imageUrl);
  const uploadedTags = await uploadFileToBlossom(imageFile, signer);
  const nip96ImageUrl = uploadedTags[0][1]; // The URL is usually the second element of the first tag

  // Construct Nostr event
  const baseEvent = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['t', 'instagram-mirror'],
      ['t', 'social-media'],
      ['u', post.originalLink],
      // Add imeta tags for the uploaded image
      ...uploadedTags,
    ],
    content: `${post.text}\n\nOriginal Post: ${post.originalLink}\nImage: ${nip96ImageUrl}`,
  };

  const signedEvent = await signer.signEvent(baseEvent);

  // Publish to Nostr using a simple pool
  // In a real application, you might want to use the app's main NostrProvider's pool
  const pool = new SimplePool();
  const relays = getBotConfig().relays || ['wss://relay.damus.io', 'wss://relay.nostr.band'];
  await pool.publish(relays, signedEvent);
  console.log('Nostr event published:', signedEvent);

  // Clean up the pool connection after publishing
  pool.close();
}
