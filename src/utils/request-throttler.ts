// utils/request-throttler.ts

type ThrottleConfig = {
    maxRequests: number;
    perMilliseconds: number;
  };
  
  export class RequestThrottler {
    private queue: (() => void)[] = [];
    private activeCount = 0;
    private lastReset = Date.now();
    private executedInWindow = 0;
    private readonly config: ThrottleConfig;
  
    constructor(config: ThrottleConfig) {
      this.config = config;
      setInterval(() => this.resetWindow(), config.perMilliseconds);
    }
  
    private resetWindow() {
      this.executedInWindow = 0;
      this.lastReset = Date.now();
      this.processQueue();
    }
  
    private processQueue() {
      while (
        this.queue.length > 0 &&
        this.executedInWindow < this.config.maxRequests
      ) {
        const task = this.queue.shift();
        if (task) {
          this.executedInWindow++;
          task();
        }
      }
    }
  
    public schedule<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        const execute = () => {
          fn().then(resolve).catch(reject);
        };
  
        if (this.executedInWindow < this.config.maxRequests) {
          this.executedInWindow++;
          execute();
        } else {
          this.queue.push(execute);
        }
      });
    }
  }