// LEGACY: archived 2025-06-09 - Birdeye API service not used in final pipeline
// src/api/birdeye.ts
import axios, { AxiosResponse, AxiosError } from 'axios';
import config from '../config/config';

interface TokenPrice {
    value: number;
    updateUnixTime: number;
    updateHour: number;
}

interface VolumeData {
    value: number;
    valueChangePercent: number;
    time: number;
}

interface BirdeyeResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

class BirdeyeAPI {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = 'https://public-api.birdeye.so';
        this.apiKey = config.birdeyeApiKey;
    }

    private async makeRequest<T>(endpoint: string): Promise<BirdeyeResponse<T>> {
        try {
            const response: AxiosResponse<BirdeyeResponse<T>> = await axios.get(
                `${this.baseUrl}${endpoint}`,
                {
                    headers: {
                        'X-API-KEY': this.apiKey,
                        'Accept': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Birdeye API Error:', error.response?.data?.message || error.message);
                throw error;
            }
            console.error('Unexpected error:', error);
            throw error;
        }
    }

    async getTokenPrice(tokenAddress: string): Promise<BirdeyeResponse<TokenPrice>> {
        return this.makeRequest<TokenPrice>(`/public/price?address=${tokenAddress}`);
    }

    async getVolumeHistory(
        tokenAddress: string,
        timeframe: '1H' | '24H' | '7D' = '24H'
    ): Promise<BirdeyeResponse<VolumeData[]>> {
        return this.makeRequest<VolumeData[]>(
            `/public/token_volume_history?address=${tokenAddress}&type=${timeframe}`
        );
    }

    async getPriceHistory(
        tokenAddress: string,
        timeframe: '1H' | '24H' | '7D' = '24H'
    ): Promise<BirdeyeResponse<TokenPrice[]>> {
        return this.makeRequest<TokenPrice[]>(
            `/public/token_price_history?address=${tokenAddress}&type=${timeframe}`
        );
    }

    async monitorToken(tokenAddress: string): Promise<{
        price: TokenPrice;
        volume24h: VolumeData[];
        priceHistory: TokenPrice[];
    }> {
        try {
            const [price, volume, priceHistory] = await Promise.all([
                this.getTokenPrice(tokenAddress),
                this.getVolumeHistory(tokenAddress),
                this.getPriceHistory(tokenAddress)
            ]);

            return {
                price: price.data,
                volume24h: volume.data,
                priceHistory: priceHistory.data
            };
        } catch (error) {
            console.error('Error monitoring token:', error);
            throw error;
        }
    }

    async analyzePriceMovement(tokenAddress: string): Promise<{
        currentPrice: number;
        priceChange24h: number;
        volume24h: number;
        volatility: number;
    }> {
        const data = await this.monitorToken(tokenAddress);
        
        const currentPrice = data.price.value;
        const prices24h = data.priceHistory.map(p => p.value);
        const oldestPrice = prices24h[0] || currentPrice;
        
        // Calculate price change percentage
        const priceChange24h = ((currentPrice - oldestPrice) / oldestPrice) * 100;
        
        // Calculate total volume
        const volume24h = data.volume24h.reduce((sum, vol) => sum + vol.value, 0);
        
        // Calculate volatility (standard deviation of price changes)
        const priceChanges = prices24h.slice(1).map((price, i) => 
            ((price - prices24h[i]) / prices24h[i]) * 100
        );
        const volatility = this.calculateVolatility(priceChanges);

        return {
            currentPrice,
            priceChange24h,
            volume24h,
            volatility
        };
    }

    private calculateVolatility(priceChanges: number[]): number {
        const mean = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
        const squaredDiffs = priceChanges.map(change => Math.pow(change - mean, 2));
        const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
        return Math.sqrt(variance);
    }
}

export default new BirdeyeAPI();