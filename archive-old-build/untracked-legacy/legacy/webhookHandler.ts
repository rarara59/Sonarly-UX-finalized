// src/services/webhookHandler.ts
import express, { Request, Response } from 'express';
import dataHandler from './dataHandler';
import { ITransaction } from '../types/database';

class WebhookHandler {
    private app: express.Application;
    private port: number;

    constructor(port: number = 3000) {
        this.app = express();
        this.port = port;
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({ status: 'ok' });
        });

        // Transaction webhook endpoint
        this.app.post('/webhook/transaction', async (req: Request, res: Response) => {
            try {
                const transaction = this.validateTransaction(req.body);
                await this.processTransaction(transaction);
                res.status(200).json({ status: 'success' });
            } catch (error) {
                console.error('Error processing webhook:', error);
                res.status(400).json({ 
                    status: 'error', 
                    message: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        });
    }

    private validateTransaction(data: any): ITransaction {
        const requiredFields = ['hash', 'tokenAddress', 'pairAddress', 'price', 'volume', 'type', 'walletAddress'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (!['BUY', 'SELL'].includes(data.type)) {
            throw new Error('Invalid transaction type. Must be BUY or SELL');
        }

        return {
            hash: data.hash,
            timestamp: new Date(),
            tokenAddress: data.tokenAddress,
            pairAddress: data.pairAddress,
            price: Number(data.price),
            volume: Number(data.volume),
            type: data.type as 'BUY' | 'SELL',
            walletAddress: data.walletAddress,
            tokenInfo: data.tokenInfo
        };
    }

    private async processTransaction(transaction: ITransaction) {
        try {
            // Save transaction to database
            await dataHandler.saveTransaction(transaction);
            
            // Monitor transaction
            await transactionMonitor.monitorTransaction(transaction);
            
        } catch (error) {
            console.error('Error processing transaction:', error);
            throw error;
        }
    }

    public start() {
        this.app.listen(this.port, () => {
            console.log(`Webhook server running on port ${this.port}`);
        });
    }
}

export default WebhookHandler;