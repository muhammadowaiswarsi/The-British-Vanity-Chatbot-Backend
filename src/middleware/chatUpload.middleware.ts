import multer from 'multer';
import type { RequestHandler } from 'express';

export const CHAT_ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const CHAT_MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const chatImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CHAT_MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!CHAT_ALLOWED_IMAGE_TYPES.includes(file.mimetype as (typeof CHAT_ALLOWED_IMAGE_TYPES)[number])) {
      cb(new Error('Only PNG, JPG, JPEG and WEBP images are allowed'));
      return;
    }
    cb(null, true);
  },
});

const handleUploadError = (err: unknown, res: import('express').Response, next: () => void): void => {
  if (err) {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'Image must be 5MB or smaller.',
      });
      return;
    }

    const message = err instanceof Error ? err.message : 'Image upload failed';
    res.status(400).json({ success: false, message });
    return;
  }

  next();
};

export const optionalChatImageUpload: RequestHandler = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    next();
    return;
  }

  chatImageUpload.single('image')(req, res, (err) => handleUploadError(err, res, next));
};

export const requiredChatImageUpload: RequestHandler = (req, res, next) => {
  chatImageUpload.single('image')(req, res, (err) => {
    if (err) {
      handleUploadError(err, res, next);
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Image is required.',
      });
      return;
    }

    next();
  });
};
