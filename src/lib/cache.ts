import { NodeCache } from "@cacheable/node-cache";
export class Cache {
    private static instance: Cache;
    private cache: NodeCache<unknown>;

    private constructor() {
        this.cache = new NodeCache<unknown>({
            stdTTL: 300,
            checkperiod: 60,
            useClones: false,
        });
    }

    public static getInstance(): Cache {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }

        return Cache.instance;
    }

    public get<T>(key: string): T | undefined {
        return this.cache.get(key) as T | undefined;
    }

    public set<T>(key: string, value: T, ttl?: number): boolean {
        if (ttl !== undefined) {
            return this.cache.set(key, value, ttl);
        }

        return this.cache.set(key, value);
    }

    public del(key: string): number {
        return this.cache.del(key);
    }

    public clear(): void {
        this.cache.flushAll();
    }

    public has(key: string): boolean {
        return this.cache.has(key);
    }

    public getTtl(key: string): number | undefined {
        return this.cache.getTtl(key);
    }


    public updateTtl(key: string, ttlSeconds: number | string): boolean {
        return this.cache.ttl(key, ttlSeconds);
    }

}