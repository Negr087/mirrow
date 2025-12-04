
import { BlossomUploader } from '@nostrify/nostrify/uploaders';
import { type NostrSigner } from '@nostrify/nostrify';

export async function uploadFileToBlossom(file: File, signer: NostrSigner): Promise<string[][]> {
  const uploader = new BlossomUploader({
    servers: [
      'https://blossom.primal.net/',
    ],
    signer,
  });

  const tags = await uploader.upload(file);
  return tags;
}
