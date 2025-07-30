// src/services/webhooks/helius-handler.ts
import { Router, Request, Response } from 'express';
import { LPEventCache } from '../lp-event-cache.service'; // ✅ Make sure this path is correct

const router = Router();

router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    if (!Array.isArray(data)) {
      console.error('Invalid payload:', data);
      res.status(400).send('Invalid payload');
      return;
    }

    for (const event of data) {
      const { tokenTransfers, instructions, timestamp, signature, feePayer } = event;

      if (!tokenTransfers || tokenTransfers.length === 0) continue;

      const mintSet = new Set<string>();
      let quoteToken = 'UNKNOWN';
      let estimatedValue = 0;
      let dex = 'UNKNOWN';

      for (const t of tokenTransfers) {
        if (t.mint) {
          mintSet.add(t.mint);

          if (t.tokenStandard === 'Fungible' && t.amount) {
            if (t.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
              quoteToken = 'USDC';
              estimatedValue = t.amount * 2;
            } else if (t.mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
              quoteToken = 'USDT';
              estimatedValue = t.amount * 2;
            }
          }
        }
      }

      if (Array.isArray(instructions)) {
        for (const i of instructions) {
          if (i.programId === 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc') dex = 'Orca';
          else if (i.programId === '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8') dex = 'Raydium';
          else if (i.programId === 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K') dex = 'Meteora';
        }
      }

      const hasInitialBuys = tokenTransfers.some(
        (t: any) => t.fromTokenAccount && t.toTokenAccount && t.fromTokenAccount !== t.toTokenAccount
      );

      for (const mint of mintSet) {
        if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' || mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
          continue;
        }

        LPEventCache.store({
          tokenAddress: mint,
          lpValueUSD: estimatedValue,
          quoteToken,
          timestamp,
          deployer: feePayer,
          hasInitialBuys,
          dex,
          txHash: signature,
        });
      }
    }

    res.status(200).send('ok');
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).send('Internal server error');
  }
});

export default router;