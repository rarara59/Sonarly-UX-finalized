// src/services/apis/birdeye/birdeye-monitor.ts

import axios from 'axios';
import { config } from '../../../config';

export class BirdEyeMonitor {
    private readonly baseUrl = 'https://public-api.birdeye.so';
    private readonly headers: { [key: string]: string };

    constructor() {
        this.headers = {
            'X-API-KEY': config.birdeyeApiKey || '',
            'Content-Type': 'application/json'
        };
    }

    async getTokenPrice(tokenAddress: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/public/price?address=${tokenAddress}`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching token price:', error);
            throw error;
        }
    }

    async getTokenVolume(tokenAddress: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/public/trade_volume?address=${tokenAddress}`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching token volume:', error);
            throw error;
        }
    }

    async getMultipleTokenPrices(tokenAddresses: string[]) {
        try {
            const addresses = tokenAddresses.join(',');
            const response = await axios.get(
                `${this.baseUrl}/public/multi_price?addresses=${addresses}`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching multiple token prices:', error);
            throw error;
        }
    }

    async getMarketDepth(tokenAddress: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/public/market_depth?address=${tokenAddress}`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching market depth:', error);
            throw error;
        }
    }

    async getPriceHistory(
        tokenAddress: string, 
        timeframe: '1H' | '24H' | '7D' = '24H'
    ) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/public/price_history?address=${tokenAddress}&timeframe=${timeframe}`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching price history:', error);
            throw error;
        }
    }
}