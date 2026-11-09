import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { env } from "../lib/env";

export interface StoredFile {
  url: string;
  fileName: string;
  sizeBytes: number;
}

interface StorageProvider {
  save(originalName: string, buffer: Buffer): Promise<StoredFile>;
}

class LocalStorageProvider implements StorageProvider {
  private dir = path.resolve(process.cwd(), env.uploadDir);

  constructor() {
    fs.mkdirSync(this.dir, { recursive: true });
  }

  async save(originalName: string, buffer: Buffer): Promise<StoredFile> {
    const ext = path.extname(originalName);
    const fileName = `${uuid()}${ext}`;
    fs.writeFileSync(path.join(this.dir, fileName), buffer);
    return {
      url: `${env.publicBaseUrl}/uploads/${fileName}`,
      fileName,
      sizeBytes: buffer.length,
    };
  }
}

// To go to production S3-compatible storage, implement StorageProvider
// against @aws-sdk/client-s3 and swap the export below based on
// env.storageProvider — no caller code changes.
export const storage: StorageProvider = new LocalStorageProvider();
