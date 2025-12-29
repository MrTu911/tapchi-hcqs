
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

// Lazy initialization - only create when needed (server-side)
let s3Client: S3Client | null = null;
let bucketName: string | null = null;
let folderPrefix: string | null = null;

function getS3Config() {
  if (!s3Client) {
    s3Client = createS3Client();
    const config = getBucketConfig();
    bucketName = config.bucketName;
    folderPrefix = config.folderPrefix;
  }
  return { s3Client, bucketName: bucketName!, folderPrefix: folderPrefix! };
}

/**
 * Upload a file to S3
 * @param buffer File buffer
 * @param key S3 key (path) for the file
 * @param contentType MIME type of the file
 * @returns Full S3 key (cloud_storage_path)
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType?: string
): Promise<string> {
  const { s3Client, bucketName, folderPrefix } = getS3Config();
  const fullKey = folderPrefix ? `${folderPrefix}${key}` : key;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fullKey,
    Body: buffer,
    ContentType: contentType
  });

  await s3Client.send(command);
  return fullKey;
}

/**
 * Get a signed URL for downloading a file from S3
 * @param key S3 key (cloud_storage_path)
 * @param expiresIn URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const { s3Client, bucketName } = getS3Config();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Delete a file from S3
 * @param key S3 key (cloud_storage_path)
 */
export async function deleteFile(key: string): Promise<void> {
  const { s3Client, bucketName } = getS3Config();
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key
  });

  await s3Client.send(command);
}

/**
 * Rename/move a file in S3
 * @param oldKey Current S3 key
 * @param newKey New S3 key
 */
export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  const { s3Client, bucketName, folderPrefix } = getS3Config();
  const fullNewKey = folderPrefix ? `${folderPrefix}${newKey}` : newKey;

  // Copy to new location
  const copyCommand = new CopyObjectCommand({
    Bucket: bucketName,
    CopySource: `${bucketName}/${oldKey}`,
    Key: fullNewKey
  });
  await s3Client.send(copyCommand);

  // Delete old file
  await deleteFile(oldKey);

  return fullNewKey;
}

/**
 * Check if a file exists in S3
 * @param key S3 key (cloud_storage_path)
 * @returns boolean
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const { s3Client, bucketName } = getS3Config();
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get file metadata from S3
 * @param key S3 key (cloud_storage_path)
 */
export async function getFileMetadata(key: string) {
  const { s3Client, bucketName } = getS3Config();
  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: key
  });

  const response = await s3Client.send(command);
  return {
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    lastModified: response.LastModified,
    metadata: response.Metadata
  };
}
