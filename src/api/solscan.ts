// src/api/solscan.ts
import axios, { AxiosError } from 'axios';
import config from '../config/config';

class SolscanAPI {
    private baseUrl: string;
    private maxRetries: number;

    constructor() {
        this.baseUrl = 'https://public-api.solscan.io';
        this.maxRetries = 3;
    }

    private async makeRequest<T>(endpoint: string, retryCount = 0): Promise<T> {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            console.log('Making request to:', url); // Debug log
            
            const response = await axios.get<T>(url, {
                headers: {
                    'accept': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Request failed:', {
                    url: `${this.baseUrl}${endpoint}`,
                    status: error.response?.status,
                    data: error.response?.data
                });
                
                if (error.response?.status === 429 && retryCount < this.maxRetries) {
                    const waitTime = Math.pow(2, retryCount) * 1000;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return this.makeRequest<T>(endpoint, retryCount + 1);
                }
                throw new Error(`Solscan API Error: ${error.response?.data || error.message}`);
            }
            throw new Error('Unexpected error occurred');
        }
    }

    async getTokenInfo(tokenAddress: string): Promise<any> {
        return this.makeRequest(`/token/meta/${tokenAddress}`);
    }

    async checkTokenHolders(tokenAddress: string): Promise<any> {
        return this.makeRequest(`/token/holders/${tokenAddress}`);
    }

    async getMarketInfo(tokenAddress: string): Promise<any> {
        return this.makeRequest(`/market/token/${tokenAddress}`);
    }
}

export default new SolscanAPI();