import { Request, Response } from 'express';
import { indexPolicies, searchPolicies } from '../services/policy-index.service';

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

export const testPoliciesSearchHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = String(req.query.query ?? 'Can I return a product?').trim();
    const results = await searchPolicies(query);

    res.json({
      success: true,
      query,
      results,
    });
  } catch (error) {
    console.error('Policy search test failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Policy search test failed',
    });
  }
};
