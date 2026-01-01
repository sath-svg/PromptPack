import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const originalEnv = new Set(Object.keys(process.env));
const loadedFromDotEnv = new Set();

const parseEnvValue = (rawValue) => {
  let value = rawValue.trim();
  if (!value) return "";
  const isQuoted =
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"));
  if (!isQuoted && value.includes("#")) {
    value = value.split("#")[0].trim();
  }
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
};

const setEnvValue = (key, value, override) => {
  const isOriginal = originalEnv.has(key);
  if (!override) {
    if (!isOriginal && process.env[key] === undefined) {
      process.env[key] = value;
      loadedFromDotEnv.add(key);
    }
    return;
  }
  if (!isOriginal || loadedFromDotEnv.has(key)) {
    process.env[key] = value;
    loadedFromDotEnv.add(key);
  }
};

const loadEnvFile = (filePath, override = false) => {
  try {
    const contents = readFileSync(filePath, "utf8");
    const lines = contents.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) continue;
      let key = trimmed.slice(0, eqIndex).trim();
      if (key.startsWith("export ")) {
        key = key.slice("export ".length).trim();
      }
      const rawValue = trimmed.slice(eqIndex + 1);
      const value = parseEnvValue(rawValue);
      setEnvValue(key, value, override);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
};

const cwd = process.cwd();
loadEnvFile(path.join(cwd, ".env"), false);
loadEnvFile(path.join(cwd, ".env.local"), true);

const rawEndpoint =
  process.env.R2_S3_ENDPOINT ||
  process.env.R2_S3_URL ||
  process.env.AWS_ENDPOINT_URL;
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const useSessionToken =
  process.env.R2_USE_SESSION_TOKEN === "true" ||
  process.env.R2_USE_SESSION_TOKEN === "1";
const sessionToken = useSessionToken
  ? process.env.R2_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN
  : undefined;
const region = process.env.AWS_REGION || "auto";

if (!rawEndpoint) {
  console.error("Missing R2_S3_ENDPOINT (or R2_S3_URL/AWS_ENDPOINT_URL).");
  process.exit(1);
}
if (!accessKeyId || !secretAccessKey) {
  console.error("Missing R2/AWS credentials (R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY).");
  process.exit(1);
}

const endpointUrl = new URL(rawEndpoint);
let bucket = process.env.R2_BUCKET;
if (!bucket) {
  const pathParts = endpointUrl.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
  if (pathParts.length > 0) {
    bucket = pathParts[0];
    endpointUrl.pathname = "/";
  }
}
if (!bucket) {
  console.error("Missing R2_BUCKET and bucket not found in endpoint URL.");
  process.exit(1);
}

const endpoint = endpointUrl.origin;
const publicDir = process.env.PUBLIC_DIR || path.join(process.cwd(), "public");
const assetDir = process.env.ASSET_DIR || path.join(publicDir, "img");
const publicBase =
  process.env.PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  "";
const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

const contentTypeByExt = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: sessionToken
    ? { accessKeyId, secretAccessKey, sessionToken }
    : { accessKeyId, secretAccessKey },
});

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
};

const toPosixPath = (filePath) => filePath.split(path.sep).join("/");

const buildPublicUrl = (key) => {
  if (!publicBase) return "";
  const base = publicBase.endsWith("/") ? publicBase.slice(0, -1) : publicBase;
  return `${base}/${key}`;
};

const uploadFile = async (filePath) => {
  const key = toPosixPath(path.relative(publicDir, filePath));
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypeByExt[ext] || "application/octet-stream";
  const body = await readFile(filePath);

  if (dryRun) {
    console.log(`[dry-run] ${key}`);
    return;
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });
  await client.send(command);
  const publicUrl = buildPublicUrl(key);
  console.log(`Uploaded ${key}${publicUrl ? ` -> ${publicUrl}` : ""}`);
};

const main = async () => {
  const files = await walk(assetDir);
  if (files.length === 0) {
    console.log(`No files found in ${assetDir}`);
    return;
  }

  for (const filePath of files) {
    await uploadFile(filePath);
  }
};

main().catch((error) => {
  console.error("Upload failed:", error);
  process.exit(1);
});
