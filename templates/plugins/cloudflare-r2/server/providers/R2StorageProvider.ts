import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { extname } from 'path'
import { randomUUID } from 'crypto'
import type { StorageProvider, UploadResult } from './storage'

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET!
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')

export class R2StorageProvider implements StorageProvider {
  async upload({ buffer, originalName, mimeType }: {
    buffer: Buffer
    originalName: string
    mimeType: string
  }): Promise<UploadResult> {
    const ext = extname(originalName).toLowerCase()
    const key = `${randomUUID()}${ext}`

    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ContentLength: buffer.length,
      }),
    )

    return {
      url: `${PUBLIC_URL}/${key}`,
      key,
      mimeType,
      size: buffer.length,
    }
  }

  async delete(key: string): Promise<void> {
    await client.send(
      new DeleteObjectCommand({ Bucket: BUCKET, Key: key }),
    )
  }
}
