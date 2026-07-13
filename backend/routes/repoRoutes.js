import express from 'express';
import {analyzeRepo} from '../controllers/repoController.js';
import { askQuestion } from '../controllers/repoController.js';
import {
  buildTimeline,
  askTimeline,
  timelineStatus,
} from '../controllers/timelineController.js';


const router = express.Router();

router.post('/analyze',analyzeRepo);
router.post('/ask', askQuestion);
router.post('/timeline/build', buildTimeline);
router.post('/timeline/ask', askTimeline);
router.get('/timeline/status', timelineStatus);

export default router;