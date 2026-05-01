import crypto from "crypto";
import dotenv from "dotenv";

// dotenv.config();

const algorithm = "aes-256-cbc";

// 🔥 Ensure key exists
if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY is missing in .env");
}

// 🔥 Key must be 32 bytes (64 hex chars)
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

// 🔹 Encrypt
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

// 🔹 Decrypt
export function decrypt(text: string): string {
  const textParts = text.split(":");

  const iv = Buffer.from(textParts.shift() as string, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encryptedText).toString("utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}