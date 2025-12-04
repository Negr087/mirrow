
// src/bot/instagram-scraper.ts
// NOTE: This is a highly fragile and basic Instagram scraper.
// Instagram actively blocks automated scraping, and this approach is prone to breaking
// if Instagram changes its HTML structure or implements anti-bot measures.
// A robust solution would require a dedicated backend service with proper Instagram API integration
// or more advanced scraping techniques with proxies and headless browsers.

export interface InstagramPost {
  id: string;
  imageUrl: string;
  text: string;
  originalLink: string;
}

export async function fetchInstagramPosts(usernames: string[]): Promise<InstagramPost[]> {
  const allPosts: InstagramPost[] = [];
  console.log('Attempting to fetch Instagram posts for:', usernames);

  for (const username of usernames) {
    const profileUrl = `https://www.instagram.com/${username}/`;
    try {
      // Using a CORS proxy to bypass potential CORS issues in the browser.
      const proxyUrl = `https://proxy.shakespeare.diy/?url=${encodeURIComponent(profileUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        console.error(`Failed to fetch Instagram profile for ${username}: ${response.status} ${response.statusText}`);
        continue;
      }

      const html = await response.text();

      // Attempt to extract relevant data from the HTML
      // This regex is highly specific and likely to break with Instagram's updates.
      // It tries to find the JSON-LD script tag which often contains post data.
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
      if (jsonLdMatch && jsonLdMatch[1]) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          const postsData = jsonData.itemListElement || [];

          for (const item of postsData) {
            if (item.item && item.item['@type'] === 'ImageObject') {
              const postIdMatch = item.item.url.match(/\/p\/([^\/]+)/);
              const postId = postIdMatch ? postIdMatch[1] : item.item.url;

              allPosts.push({
                id: postId,
                imageUrl: item.item.contentUrl,
                text: item.item.caption || '',
                originalLink: item.item.url,
              });
            } else if (item['@type'] === 'GraphImage' || item['@type'] === 'GraphVideo' || item['@type'] === 'GraphSidecar') {
                // Older Instagram JSON-LD structure
                const postIdMatch = item.shortcode;
                if(postIdMatch) {
                    allPosts.push({
                        id: postIdMatch,
                        imageUrl: item.display_url || item.thumbnail_src || '',
                        text: item.edge_media_to_caption?.edges[0]?.node?.text || '',
                        originalLink: `https://www.instagram.com/p/${postIdMatch}/`,
                    });
                }
            }
          }
        } catch (jsonError) {
          console.error(`Error parsing JSON-LD for ${username}:`, jsonError);
        }
      }

      // Fallback: More generic image and text extraction if JSON-LD fails or is absent
      // This is even more fragile.
      const imageMatches = html.matchAll(/<img[^>]+src="([^"]+\.jpg)"[^>]*alt="([^"]*)"/g);
      for (const match of imageMatches) {
        const imageUrl = match[1];
        const altText = match[2];
        const postLink = profileUrl; // Fallback to profile URL

        // Simple heuristic to avoid duplicates from JSON-LD or very generic images
        if (imageUrl.includes('/p/') && !allPosts.some(p => p.imageUrl === imageUrl)) {
          allPosts.push({
            id: imageUrl, // Using image URL as ID for simplicity here
            imageUrl,
            text: altText,
            originalLink: postLink,
          });
        }
      }

    } catch (error) {
      console.error(`Error fetching Instagram posts for ${username}:`, error);
    }
  }

  console.log(`Found ${allPosts.length} posts.`);
  return allPosts;
}
