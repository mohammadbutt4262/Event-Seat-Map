export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  requests: number;
  totalResponseTimeMs: number;
}
