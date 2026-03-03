import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const getS3Config = () => {
    const s3Region = process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1';
    const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

    return { s3Region, bucketName, accessKeyId, secretAccessKey };
};

export const isS3Configured = () => {
    const { bucketName, accessKeyId, secretAccessKey } = getS3Config();
    return Boolean(bucketName && accessKeyId && secretAccessKey);
};

export const getS3BaseUrl = () => {
    const { bucketName, s3Region } = getS3Config();
    if (!bucketName) return '';
    return `https://${bucketName}.s3.${s3Region}.amazonaws.com`;
};

export const getS3Client = () => {
    const { s3Region, accessKeyId, secretAccessKey } = getS3Config();
    return new S3Client({
        region: s3Region,
        credentials: {
            accessKeyId: accessKeyId || '',
            secretAccessKey: secretAccessKey || '',
        },
    });
};

export async function uploadToS3(filename: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    const { bucketName, s3Region } = getS3Config();
    if (!bucketName) {
        throw new Error("AWS_S3_BUCKET is not defined in environment variables");
    }

    const s3Client = getS3Client();
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);

    return `https://${bucketName}.s3.${s3Region}.amazonaws.com/${filename}`;
}

export async function deleteFromS3(fileUrl: string) {
    const { bucketName } = getS3Config();
    if (!bucketName) {
        throw new Error("AWS_S3_BUCKET is not defined in environment variables");
    }

    // Extract the filename (Key) from the URL
    // URL format: https://bucket-name.s3.region.amazonaws.com/filename
    const urlParts = fileUrl.split('/');
    const key = decodeURIComponent(urlParts[urlParts.length - 1]);

    const s3Client = getS3Client();
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    await s3Client.send(command);
}
