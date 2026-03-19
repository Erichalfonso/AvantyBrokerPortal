import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "dev-key";
  return scryptSync(secret, "avanty-salt", 32);
}

export function encrypt(text: string): string {
  if (!text) return text;
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;

  try {
    const key = getKey();
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    // If decryption fails, return as-is (data might not be encrypted yet)
    return encryptedText;
  }
}

// Encrypt PHI fields in a trip object before storage
export function encryptPHI(data: Record<string, unknown>): Record<string, unknown> {
  const phiFields = ["patientName", "patientPhone"];
  const result = { ...data };

  for (const field of phiFields) {
    if (typeof result[field] === "string") {
      result[field] = encrypt(result[field] as string);
    }
  }

  return result;
}

// Decrypt PHI fields in a trip object after retrieval
export function decryptPHI<T extends Record<string, unknown>>(data: T): T {
  const phiFields = ["patientName", "patientPhone"];
  const result = { ...data };

  for (const field of phiFields) {
    if (typeof result[field] === "string") {
      (result as Record<string, unknown>)[field] = decrypt(result[field] as string);
    }
  }

  return result;
}
