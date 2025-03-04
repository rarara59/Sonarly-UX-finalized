// src/config/config.ts
import dotenv from 'dotenv';
dotenv.config();
interface Config {
  // Original APIs
  dexscreenerApi: string;
  solscan: {
    apiKey: string;
  };
  birdeye: {
    apiKey: string;
  };
  // RPC Configuration
  rpc: {
    drpc: {
      url: string;
      apiKey: string;
    };
    chainstack: {
      url: string;
      apiKey: string;
    };
    helius: {
      url: string;
      apiKey: string;
    };
  };
  // DEX APIs Configuration (added to fix market-data-service)
  dexApis: {
    dexscreener: {
      baseUrl: string;
      apiKey: string;
    };
    jupiter: {
      baseUrl: string;
      apiKey: string;
    };
    birdeye: {
      baseUrl: string;
      apiKey: string;
    };
  };
  // System Configuration
  system: {
    scanLimit: number;
    minLiquidity: number;
    patterns: {
      fastWindow: number;
      slowWindow: number;
      targetSuccessRate: number;
      minimumEdge: number;
    };
  };
  // Database Configuration
  database: {
    mongoUri: string;
  };
  // Logging Configuration
  logging: {
    level: string;
    file: {
      error: string;
      combined: string;
    };
  };
}

const config: Config = {
  // Original APIs
  dexscreenerApi: process.env.DEXSCREENER_API_URL || 'https://api.dexscreener.com/latest',
  solscan: {
    apiKey: process.env.SOLSCAN_API_KEY || ''
  },
  birdeye: {
    apiKey: process.env.BIRDEYE_API_KEY || ''
  },
  // RPC Configuration
  rpc: {
    drpc: {
      url: process.env.DRPC_RPC_URL || 'https://free-mainnet-rpc.drpc.org',
      apiKey: process.env.DRPC_API_KEY || ''
    },
    chainstack: {
      url: process.env.SOLANA_RPC_ENDPOINT || '',
      apiKey: process.env.CHAINSTACK_API_KEY || ''
    },
    helius: {
      url: process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com',
      apiKey: process.env.HELIUS_API_KEY || ''
    }
  },
  // DEX APIs Configuration (added to fix market-data-service)
  dexApis: {
    dexscreener: {
      baseUrl: 'https://api.dexscreener.com/latest',
      apiKey: ''
    },
    jupiter: {
      baseUrl: 'https://quote-api.jup.ag/v6',
      apiKey: ''
    },
    birdeye: {
      baseUrl: 'https://public-api.birdeye.so',
      apiKey: process.env.BIRDEYE_API_KEY || ''
    }
  },
  // System Configuration
  system: {
    scanLimit: parseInt(process.env.SCAN_LIMIT || '100'),
    minLiquidity: parseInt(process.env.MIN_LIQUIDITY || '10000'),
    patterns: {
      fastWindow: parseInt(process.env.FAST_PATTERN_WINDOW || '4'),
      slowWindow: parseInt(process.env.SLOW_PATTERN_WINDOW || '48'),
      targetSuccessRate: parseFloat(process.env.TARGET_SUCCESS_RATE || '0.75'),
      minimumEdge: parseFloat(process.env.MINIMUM_EDGE || '0.2')
    }
  },
  // Database Configuration
  database: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/thorpv1'
  },
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      error: process.env.ERROR_LOG_FILE || 'error.log',
      combined: process.env.COMBINED_LOG_FILE || 'combined.log'
    }
  }
};

export default config;