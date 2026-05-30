import Redis, { type RedisOptions } from "ioredis"

type RedisGlobal = typeof globalThis & {
	__greemRedis?: Redis
}

const globalRedis = globalThis as RedisGlobal

function buildRedisOptions(rawUrl: string): RedisOptions {
	try {
		const parsed = new URL(rawUrl)
		const databaseIndex =
			parsed.pathname && parsed.pathname !== "/"
				? Number(parsed.pathname.slice(1))
				: 0

		return {
			host: parsed.hostname || "127.0.0.1",
			port: parsed.port ? Number(parsed.port) : 6379,
			password: parsed.password || undefined,
			db: Number.isFinite(databaseIndex) ? databaseIndex : 0,
			tls: parsed.protocol === "rediss:" ? {} : undefined,
			lazyConnect: true,
			enableReadyCheck: false,
			connectTimeout: 5_000,
			maxRetriesPerRequest: 1,
			retryStrategy: () => null,
		}
	} catch {
		return {
			host: "127.0.0.1",
			port: 6379,
			lazyConnect: true,
			enableReadyCheck: false,
			connectTimeout: 5_000,
			maxRetriesPerRequest: 1,
			retryStrategy: () => null,
		}
	}
}

function createRedisClient() {
	const client = new Redis(buildRedisOptions(process.env.REDIS_URL ?? "redis://127.0.0.1:6379"))

	client.on("error", (error) => {
			console.warn("[redis] connection error:", error instanceof Error ? error.message : error)
	})

	return client
}

export const redis = globalRedis.__greemRedis ?? createRedisClient()

if (!globalRedis.__greemRedis) {
	globalRedis.__greemRedis = redis
}
