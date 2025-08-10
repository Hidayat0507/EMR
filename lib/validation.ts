import { z } from 'zod';

export const referralBodySchema = z.object({
  text: z.string().min(1).max(10_000),
});

export const soapRewriteBodySchema = z.object({
  text: z.string().min(1).max(10_000),
});

export const ocrBodySchema = z.object({
  image: z.string().min(100).max(20_000_000), // base64 size bound
});


