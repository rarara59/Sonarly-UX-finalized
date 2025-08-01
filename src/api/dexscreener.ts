import axios, { AxiosResponse } from 'axios';
import config from '../legacy/config';

interface DexscreenerResponse {
    pairs: any[];  // We'll define specific types as we use them
}

class DexscreenerAPI {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.dexscreenerApi;
    }

    async searchPair(query: string): Promise<DexscreenerResponse> {
        try {
            const response: AxiosResponse<DexscreenerResponse> = 
                await axios.get(`${this.baseUrl}/dex/search?q=${query}`);
            return response.data;
        } catch (error) {
            console.error('Error searching pair:', error);
            throw error;
        }
    }

    async getTokenInfo(tokenAddress: string): Promise<DexscreenerResponse> {
        try {
            const response: AxiosResponse<DexscreenerResponse> = 
                await axios.get(`${this.baseUrl}/dex/tokens/${tokenAddress}`);
            return response.data;
        } catch (error) {
            console.error('Error getting token info:', error);
            throw error;
        }
    }
}

export default new DexscreenerAPI();