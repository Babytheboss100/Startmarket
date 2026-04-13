const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }
});

const BUCKET = process.env.R2_BUCKET_NAME;

async function uploadFile(buffer, originalName, folder = 'docs') {
  const ext = originalName.split('.').pop();
  const key = `${folder}/${uuidv4()}.${ext}`;
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer }));
  return { key, url: `${process.env.R2_PUBLIC_URL}/${key}` };
}

async function getPresignedUrl(key, expiresIn = 3600) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

async function deleteFile(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = { uploadFile, getPresignedUrl, deleteFile };
