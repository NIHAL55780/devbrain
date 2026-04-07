import express from 'express';
import {analyzeRepo} from '../controllers/repoController.js';

const router = express.Router();

router.post('/analyze',analyzeRepo);

export default router;