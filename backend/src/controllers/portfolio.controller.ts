import { Request, Response } from 'express';
import portfolioService from '../services/portfolio.service';
import { AssetType } from '@prisma/client';
import { logger } from '../utils/logger';

export const addAsset = async (req: Request, res: Response) => {
  try {
    const { assetName, assetType, symbol, amount, buyingPrice } = req.body;

    const asset = await portfolioService.addAsset(
      assetName,
      assetType as AssetType,
      symbol,
      parseFloat(amount),
      parseFloat(buyingPrice)
    );

    res.status(201).json({
      success: true,
      data: asset,
      message: 'Asset added to portfolio successfully',
    });
  } catch (error) {
    logger.error('Add asset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add asset to portfolio',
    });
  }
};

export const getPortfolio = async (req: Request, res: Response) => {
  try {
    const portfolio = await portfolioService.getPortfolioWithCurrentPrices();
    
    const totalCurrentValue = portfolio.reduce((sum, asset) => sum + asset.totalValue, 0);
    const totalCost = portfolio.reduce((sum, asset) => sum + asset.totalCost, 0);
    const totalProfitLoss = totalCurrentValue - totalCost;
    const totalProfitLossPercentage = totalCost > 0 ? ((totalCurrentValue - totalCost) / totalCost) * 100 : 0;

    res.json({
      success: true,
      data: portfolio,
      count: portfolio.length,
      summary: {
        totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalProfitLoss: parseFloat(totalProfitLoss.toFixed(2)),
        totalProfitLossPercentage: parseFloat(totalProfitLossPercentage.toFixed(2)),
      }
    });
  } catch (error) {
    logger.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio',
    });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, buyingPrice } = req.body;

    const updateData: { amount?: number; buyingPrice?: number } = {};
    if (amount !== undefined) {
      updateData.amount = parseFloat(amount);
    }
    if (buyingPrice !== undefined) {
      updateData.buyingPrice = parseFloat(buyingPrice);
    }

    const asset = await portfolioService.updateAsset(id, updateData);

    res.json({
      success: true,
      data: asset,
      message: 'Asset updated successfully',
    });
  } catch (error) {
    logger.error('Update asset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update asset',
    });
  }
};

export const removeAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await portfolioService.removeAsset(id);

    res.json({
      success: true,
      message: 'Asset removed from portfolio successfully',
    });
  } catch (error) {
    logger.error('Remove asset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove asset',
    });
  }
};

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const recommendations = await portfolioService.getRecommendations();

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    logger.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations',
    });
  }
};

export const analyzeAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recommendation = await portfolioService.analyzeAsset(id);

    res.json({
      success: true,
      data: recommendation,
      message: 'Asset analysis completed successfully',
    });
  } catch (error) {
    logger.error('Analyze asset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze asset',
    });
  }
};

export const getAssetAnalysis = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cached = await portfolioService.getCachedAnalysis(id);
    
    if (!cached) {
      return res.json({
        success: true,
        data: null,
        message: 'No analysis yet',
      });
    }

    res.json({
      success: true,
      data: cached,
    });
  } catch (error) {
    logger.error('Get asset analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset analysis',
    });
  }
};

export const syncWallet = async (req: Request, res: Response) => {
  try {
    const { holdings, resolution } = req.body;

    if (!Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'holdings must be a non-empty array',
      });
    }

    // Validate each holding
    for (const h of holdings) {
      if (!h.symbol || typeof h.amount !== 'number' || h.amount < 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid holding entry: ${JSON.stringify(h)}. Each entry needs symbol (string) and amount (number ≥ 0).`,
        });
      }
      // Default assetType to CRYPTO
      if (!h.assetType) h.assetType = 'CRYPTO';
      // Default assetName to symbol
      if (!h.assetName) h.assetName = h.symbol.toUpperCase();
    }

    const result = await portfolioService.syncWalletHoldings(holdings, resolution);

    if (result.requiresConfirmation) {
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        conflicts: result.conflicts,
        message: 'Some of these assets already exist in your portfolio. How would you like to resolve them?',
      });
    }

    res.json({
      success: true,
      message: `Wallet sync complete: ${result.added} added, ${result.updated} updated, ${result.skipped} skipped.`,
      data: result,
    });
  } catch (error) {
    logger.error('Sync wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync wallet holdings',
    });
  }
};

