// src/utils/logger.js - Fixed interface
export const logger = {
  info: (data, msg) => {
    if (typeof data === 'string') {
      console.log(data);
    } else {
      console.log(`INFO: ${msg || 'No message'}`, data);
    }
  },
  
  error: (data, msg) => {
    if (typeof data === 'string') {
      console.error(data);
    } else {
      console.error(`ERROR: ${msg || 'No message'}`, data);
    }
  },
  
  warn: (data, msg) => {
    if (typeof data === 'string') {
      console.warn(data);
    } else {
      console.warn(`WARN: ${msg || 'No message'}`, data);
    }
  },
  
  debug: (data, msg) => {
    if (typeof data === 'string') {
      console.log(data);
    } else {
      console.log(`DEBUG: ${msg || 'No message'}`, data);
    }
  }
};
