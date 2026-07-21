import { Router } from 'express';
import { getChatHistory, sendChatMessage } from '../controllers/chat.controller';
import {
  optionalChatImageUpload,
  requiredChatImageUpload,
} from '../middleware/chatUpload.middleware';

const router = Router();

router.get('/history', getChatHistory);
router.post('/', optionalChatImageUpload, sendChatMessage);
router.post('/image', requiredChatImageUpload, sendChatMessage);

export default router;
