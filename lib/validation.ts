import { z } from 'zod';

export const referralBodySchema = z.object({
  text: z.string().min(1).max(10_000),
  model: z.string().optional(),
});

export const soapRewriteBodySchema = z
  .object({
    subjective: z.string().min(1).max(10_000),
    objective: z.string().max(10_000).optional(),
    model: z.string().optional(),
  })
  .or(
    z.object({
      text: z.string().min(1).max(10_000),
      model: z.string().optional(),
    })
  );

export const ocrBodySchema = z.object({
  image: z.string().min(100).max(20_000_000), // base64 size bound
});

export const fhirExportBodySchema = z.object({
  consultationId: z.string().min(1),
});
