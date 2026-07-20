import { Request, Response } from 'express';
import { generateEmbedding } from '../services/embeddings/embedding.service';
import { indexProducts, searchProducts } from '../services/rag/rag.service';
import { indexPolicies } from '../services/policy-index.service';
import {
  createProductsCollection,
  ensureAllCollections,
  testQdrantConnection,
} from '../services/qdrant/qdrant.service';

export const createAllCollections = async (_req: Request, res: Response): Promise<void> => {
  try {
    const collections = await ensureAllCollections();

    res.status(200).json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const indexPoliciesHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await indexPolicies();
    res.json(result);
  } catch (error) {
    console.error('Policy indexing failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Policy indexing failed',
    });
  }
};

export const createCollection = async (_req: Request, res: Response): Promise<void> => {
  try {
    await createProductsCollection();

    res.status(200).json({
      success: true,
      message: 'Products collection created successfully.',
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const testEmbedding = async (_req: Request, res: Response): Promise<void> => {
  try {
    const text = `
      Name: Nike Air Max
      Brand: Nike
      Category: Shoes
      Description: Comfortable running shoes for men.
    `;

    const embedding = await generateEmbedding(text);

    res.json({
      success: true,
      dimensions: embedding.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const indexAllProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    await indexProducts();

    res.json({
      success: true,
      message: 'Products indexed successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const searchProductsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = String(req.body?.query ?? '').trim();

    if (!query) {
      res.status(400).json({
        success: false,
        message: 'Query is required.',
      });
      return;
    }

    const results = await searchProducts(query);

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const testQdrant = async (_req: Request, res: Response): Promise<void> => {
  try {
    const collections = await testQdrantConnection();

    res.json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
