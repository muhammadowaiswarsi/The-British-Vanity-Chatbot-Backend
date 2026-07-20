import { Router } from 'express';
import {
  createAllCollections,
  createCollection,
  indexAllProducts,
  indexPoliciesHandler,
  searchProductsController,
  testEmbedding,
  testQdrant,
} from '../controllers/qdrant.controller';

const router = Router();

router.get('/create-collections', createAllCollections);
router.get('/index-policies', indexPoliciesHandler);

router.post('/create-collection', createCollection);
router.post('/index-products', indexAllProducts);
router.post('/search', searchProductsController);

router.get('/test', testQdrant);
router.get('/embedding-test', testEmbedding);

export default router;
