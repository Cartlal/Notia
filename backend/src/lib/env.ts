import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  redisUrl: process.env.REDIS_URL ?? "",
  jwtAccessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  aiApiKey: process.env.AI_PROVIDER_API_KEY ?? "",
  aiBaseUrl: process.env.AI_PROVIDER_BASE_URL ?? "https://api.anthropic.com",
  aiModel: process.env.AI_MODEL ?? "claude-sonnet-5-5",
  storageProvider: process.env.STORAGE_PROVIDER ?? "local",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:4000",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
};

export const isAiConfigured = () => env.aiApiKey.length > 0;
