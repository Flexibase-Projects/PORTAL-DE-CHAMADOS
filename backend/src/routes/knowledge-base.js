import express from 'express';
import { kbController } from '../controllers/kbController.js';

const router = express.Router();

// Categories
router.get('/categories', kbController.getCategories);
router.post('/categories', kbController.createCategory);
router.put('/categories/:id', kbController.updateCategory);
router.delete('/categories/:id', kbController.deleteCategory);

// Articles
router.get('/articles', kbController.getArticles);
router.get('/articles/:id', kbController.getArticleById);
router.post('/articles', kbController.createArticle);
router.put('/articles/:id', kbController.updateArticle);
router.delete('/articles/:id', kbController.deleteArticle);

export default router;
