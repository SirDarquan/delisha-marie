import { Router } from 'express';
import ImageKit from 'imagekit';
import multer from 'multer';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

const imagekit = new ImageKit({
  publicKey: process.env['IMAGEKIT_PUBLIC_KEY'] || '',
  privateKey: process.env['IMAGEKIT_PRIVATE_KEY'] || '',
  urlEndpoint: process.env['IMAGEKIT_URL_ENDPOINT'] || '',
});

const uploadRouter = Router();

// Define paths
// process.cwd() points to the root 'delisha-marie' directory when running `npm run serve`
const imagesDir = path.join(process.cwd(), 'images');

// Ensure temp dir exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});
const upload = multer({ storage });

uploadRouter.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image uploaded' });
    return;
  }

  try {
    const inputPath = req.file.path;
    // Clean original basename to avoid shell injection
    const basename = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '');

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const results: string[] = [];

    // 1. Convert original to .webp
    const originalOutputName = `${basename}.webp`;
    const originalOutputPath = path.join(imagesDir, originalOutputName);
    await execPromise(`npx img-resizer convert "${inputPath}" "${originalOutputPath}"`);

    // 2. Upload to ImageKit
    const fileBuffer = fs.readFileSync(originalOutputPath);
    const ikResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: originalOutputName,
      folder: `/${year}/${month}`,
      useUniqueFileName: false,
    });

    results.push(ikResponse.filePath);

    // Cleanup temp files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(originalOutputPath);

    res.json({ success: true, files: results });
  } catch (error: unknown) {
    console.error('Upload processing error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process image' });
  }
});

export default uploadRouter;
