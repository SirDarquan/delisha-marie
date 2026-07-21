import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock functions
const mocks = vi.hoisted(() => {
  const mockUpload = vi.fn();
  const mockToBuffer = vi.fn();
  const mockWebp = vi.fn(() => ({ toBuffer: mockToBuffer }));
  return { mockUpload, mockToBuffer, mockWebp };
});

const { mockUpload, mockToBuffer, mockWebp } = mocks;

// Mock ImageKit
vi.mock('imagekit', () => {
  return {
    default: class {
      upload = mocks.mockUpload;
    },
  };
});

// Mock Sharp
vi.mock('sharp', () => {
  return {
    default: vi.fn(() => ({
      webp: mocks.mockWebp,
    })),
  };
});

// Mock fs
const mockExistsSync = vi.fn(() => true);
const mockMkdirSync = vi.fn();
vi.mock('node:fs', () => {
  return {
    default: {
      existsSync: mockExistsSync,
      mkdirSync: mockMkdirSync,
    },
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
  };
});

describe('Upload Router API', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);

    app = express();
    // We need to re-import the router to evaluate the top-level code again if we change mock return values
    // But since it's top-level, it only runs once unless we isolate modules.
    // We can use vi.resetModules() to test the top-level branch.
    vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  it('should create directory if it does not exist on module load', async () => {
    vi.resetModules();
    mockExistsSync.mockReturnValueOnce(false);
    await import('./upload');
    expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringContaining('images'), {
      recursive: true,
    });
  });

  it('should return 400 if no image is uploaded', async () => {
    const uploadRouterModule = await import('./upload');
    app.use('/api', uploadRouterModule.default);
    const res = await request(app).post('/api/upload');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'No image uploaded' });
  });

  it('should process and upload image successfully', async () => {
    const uploadRouterModule = await import('./upload');
    app.use('/api', uploadRouterModule.default);

    const fakeBuffer = Buffer.from('fake-webp-data');
    mockToBuffer.mockResolvedValue(fakeBuffer);
    mockUpload.mockResolvedValue({ filePath: '/test-year/test-month/test-image.webp' });

    const res = await request(app)
      .post('/api/upload')
      .attach('image', Buffer.from('original-data'), 'test-image.png');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, files: ['/test-year/test-month/test-image.webp'] });
    expect(mockWebp).toHaveBeenCalled();
    expect(mockUpload).toHaveBeenCalled();
  });

  it('should return 500 if sharp processing fails', async () => {
    const uploadRouterModule = await import('./upload');
    app.use('/api', uploadRouterModule.default);

    mockToBuffer.mockRejectedValue(new Error('Sharp error'));

    const res = await request(app)
      .post('/api/upload')
      .attach('image', Buffer.from('original-data'), 'test-image.png');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to process image' });
    expect(console.error).toHaveBeenCalled();
  });

  it('should return 500 if ImageKit upload fails', async () => {
    const uploadRouterModule = await import('./upload');
    app.use('/api', uploadRouterModule.default);

    const fakeBuffer = Buffer.from('fake-webp-data');
    mockToBuffer.mockResolvedValue(fakeBuffer);
    mockUpload.mockRejectedValue(new Error('ImageKit error'));

    const res = await request(app)
      .post('/api/upload')
      .attach('image', Buffer.from('original-data'), 'test-image.png');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to process image' });
    expect(console.error).toHaveBeenCalled();
  });
});
