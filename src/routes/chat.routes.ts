import { Router } from 'express';
import { sendChatMessage } from '../controllers/chat.controller';
import {
  optionalChatImageUpload,
  requiredChatImageUpload,
} from '../middleware/chatUpload.middleware';

const router = Router();

router.post('/', optionalChatImageUpload, sendChatMessage);
router.post('/image', requiredChatImageUpload, sendChatMessage);

export default router;
