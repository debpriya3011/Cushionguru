import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'cushion-quoting-assets';

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  // In development, return a data URL
  if (process.env.NODE_ENV === 'development') {
    const base64 = buffer.toString('base64');
    return {
      url: `data:${contentType};base64,${base64}`,
      key,
      size: buffer.length,
    };
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    url,
    key,
    size: buffer.length,
  };
}

export async function deleteFile(key: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️ Would delete file:', key);
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export function generateFileKey(
  type: string,
  category: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${type}/${category}/${timestamp}-${sanitizedFilename}`;
}
