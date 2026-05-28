import 'express';

declare module 'express' {
  export interface Request {
    tempFiles?: string[];
  }
}
