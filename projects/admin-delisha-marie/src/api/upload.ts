import { Router } from 'express';
import ImageKit from '@imagekit/nodejs';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const imagekit = new ImageKit({
  privateKey: process.env['IMAGEKIT_PRIVATE_KEY'] || 'dummy_private_key',
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
    const basename = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '');

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const webpBuffer = await sharp(fileBuffer).webp().toBuffer();

    // Determine upload folder
    let uploadFolder = `/${year}/${month}`;
    if (req.body.folder) {
      const customFolder = req.body.folder.replace(/[^a-zA-Z0-9_\-/]/g, ''); // allow alphanumeric, -, _, /
      // optionally prefix with / if missing
      uploadFolder = customFolder.startsWith('/') ? customFolder : `/${customFolder}`;
    }

    // Upload directly to ImageKit
    const ikResponse = await imagekit.files.upload({
      file: new File([webpBuffer], 'image.webp', { type: 'image/webp' }),
      fileName: `${basename}.webp`,
      folder: uploadFolder,
      useUniqueFileName: false,
    });

    res.json({ success: true, files: [ikResponse.filePath] });
  } catch (error: unknown) {
    console.error('Upload processing error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

export default uploadRouter;
