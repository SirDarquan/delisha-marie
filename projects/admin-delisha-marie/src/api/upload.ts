import { Router } from 'express';
import ImageKit from 'imagekit';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const imagekit = new ImageKit({
  publicKey: process.env['IMAGEKIT_PUBLIC_KEY'] || 'dummy_public_key',
  privateKey: process.env['IMAGEKIT_PRIVATE_KEY'] || 'dummy_private_key',
  urlEndpoint: process.env['IMAGEKIT_URL_ENDPOINT'] || 'https://ik.imagekit.io/dummy',
});

const uploadRouter = Router();

// Ensure temp dir exists
const imagesDir = path.join(process.cwd(), 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Setup multer with memory storage
const storage = multer.memoryStorage();
const limits = {
  fileSize: 1024 * 1024 * 20, // 20MB
};
const upload = multer({ storage, limits });

uploadRouter.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image uploaded' });
    return;
  }

  try {
    const fileBuffer = req.file.buffer;
    // Clean original basename to avoid weird characters
    const basename = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '');

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Convert to webp in memory using sharp
    const webpBuffer = await sharp(fileBuffer).webp().toBuffer();

    // Upload directly to ImageKit
    const ikResponse = await imagekit.upload({
      file: webpBuffer,
      fileName: `${basename}.webp`,
      folder: `/${year}/${month}`,
      useUniqueFileName: false,
    });

    res.json({ success: true, files: [ikResponse.filePath] });
  } catch (error: unknown) {
    console.error('Upload processing error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

export default uploadRouter;
