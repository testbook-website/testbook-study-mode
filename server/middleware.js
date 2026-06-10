import jwt from 'jsonwebtoken';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local upload folder exists
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer memory storage configuration (holds file buffers in memory before routing to S3 or local disk)
const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// Configure AWS S3 Client
const s3Configured = 
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY && 
  process.env.AWS_S3_BUCKET_NAME;

let s3Client = null;
if (s3Configured) {
  try {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    console.log('AWS S3 storage initialized.');
  } catch (err) {
    console.error('Failed to initialize AWS S3 client, will fall back to local disk storage.', err);
  }
} else {
  console.log('AWS S3 credentials not provided. Storing files locally on disk.');
}

// Helper to upload a file (either to S3 or locally)
export async function uploadToStorage(file, folder = 'misc') {
  if (!file) return null;
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${path.extname(file.originalname)}`;

  if (s3Configured && s3Client) {
    try {
      const bucket = process.env.AWS_S3_BUCKET_NAME;
      const key = `${folder}/${uniqueName}`;
      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      // Construct S3 URL (works for R2 or S3 standard URLs)
      return `https://${bucket}.s3.amazonaws.com/${key}`;
    } catch (err) {
      console.error('S3 upload error, falling back to local file system', err);
    }
  }

  // Local filesystem fallback
  const localPath = path.join(UPLOAD_DIR, uniqueName);
  fs.writeFileSync(localPath, file.buffer);
  return `/uploads/${uniqueName}`;
}

// Auth validation middleware
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access Denied: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_12345';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Access Denied: Invalid token' });
  }
};

// Admin route guard
export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Forbidden: Admin access only' });
  }
};
