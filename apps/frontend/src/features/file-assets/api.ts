import axios from 'axios';
import { get, post } from '@/lib/request';

export type FileAssetGroup = 'avatar' | 'library' | 'tts';

type CosPolicyResponse =
  | { exists: true; asset: { id: string } }
  | {
      exists: false;
      key: string;
      uploadUrl: string;
      method: 'PUT';
      headers: Record<string, string>;
      expiresAt: string;
    };

type CompleteUploadResponse = {
  deduped: boolean;
  asset: { id: string };
};

export async function getCurrentAvatar() {
  return get<{ assetId: string; url: string; expiresInSeconds: number } | null>('/file-assets/avatar/current');
}

export async function setCurrentAvatar(assetId: string) {
  return post<{ assetId: string; url: string; expiresInSeconds: number }>(
    '/file-assets/avatar/current',
    { assetId },
  );
}

export async function uploadFileToCosAndComplete(params: {
  file: File;
  group: FileAssetGroup;
}) {
  const { file, group } = params;
  const sha256 = await digestFileSha256(file);

  const policy = await post<CosPolicyResponse>('/file-assets/cos-policy', {
    group,
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    sha256,
  });

  if (policy.exists) {
    return policy.asset;
  }

  const uploadPolicy = policy as Extract<CosPolicyResponse, { exists: false }>;

  await axios.put(uploadPolicy.uploadUrl, file, {
    headers: uploadPolicy.headers,
  });

  const completed = await post<CompleteUploadResponse>('/file-assets/complete', {
    group,
    key: uploadPolicy.key,
    sha256,
    size: file.size,
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
  });

  return completed.asset;
}

async function digestFileSha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = Array.from(new Uint8Array(hash));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}
