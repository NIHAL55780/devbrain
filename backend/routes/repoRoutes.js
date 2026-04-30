import express from 'express';
import {analyzeRepo} from '../controllers/repoController.js';
import { askQuestion } from '../controllers/repoController.js';


const router = express.Router();

router.post('/analyze',analyzeRepo);
router.post('/ask', askQuestion);

export default router;