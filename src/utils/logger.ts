// Minimal logger to bypass winston issues
export const logger = {
  info: (msg: string) => console.log(msg),
  error: (msg: string, ...args: any[]) => console.error(msg, ...args),
  warn: (msg: string) => console.warn(msg),
  debug: (msg: string) => console.log(msg)
};
