import { request } from 'undici';

export type OCRProvider = 'google' | 'aws' | 'webhook' | 'mock';

function getProvider(): OCRProvider {
  const p = (process.env.OCR_PROVIDER || 'mock').toLowerCase();
  if (p === 'google' || p === 'aws' || p === 'webhook' || p === 'mock') return p;
  return 'mock';
}

export async function recognizeIC(imageBase64: string, _timeoutMs = Number(process.env.OCR_TIMEOUT_MS || 20_000)) {
  const provider = getProvider();
  switch (provider) {
    case 'google':
      return recognizeWithGoogle(imageBase64);
    case 'aws':
      return recognizeWithAws(imageBase64);
    case 'webhook':
      return recognizeWithWebhook(imageBase64);
    case 'mock':
    default:
      return recognizeWithMock(imageBase64);
  }
}

async function recognizeWithGoogle(imageBase64: string) {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  const endpoint = process.env.GOOGLE_VISION_ENDPOINT || 'https://vision.googleapis.com/v1/images:annotate';
  if (!apiKey) throw new Error('Missing GOOGLE_CLOUD_API_KEY');
  const body = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: 'TEXT_DETECTION' }],
      },
    ],
  };
  const res = await request(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  const data = (await res.body.json()) as any;
  const text = data?.responses?.[0]?.fullTextAnnotation?.text || '';
  return extractFields(text);
}

async function recognizeWithAws(imageBase64: string) {
  const endpoint = process.env.AWS_TEXTRACT_ENDPOINT;
  const apiKey = process.env.AWS_TEXTRACT_API_KEY; // if proxied via API Gateway
  if (!endpoint) throw new Error('Missing AWS_TEXTRACT_ENDPOINT');
  const body = { image: imageBase64 };
  const res = await request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
  });
  const data = (await res.body.json()) as any;
  const text = data?.text || '';
  return extractFields(text);
}

async function recognizeWithWebhook(imageBase64: string) {
  const url = process.env.OCR_WEBHOOK_URL;
  const header = process.env.OCR_WEBHOOK_HEADER || '';
  if (!url) throw new Error('Missing OCR_WEBHOOK_URL');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (header) {
    const [k, v] = header.split(':');
    if (k && v) headers[k.trim()] = v.trim();
  }
  const res = await request(url, { method: 'POST', body: JSON.stringify({ image: imageBase64 }), headers });
  const data = (await res.body.json()) as any;
  const text = data?.text || data?.rawText || data?.raw?.text || '';
  const directFullName = data?.fullName || data?.name || null;
  const directNric = data?.nric || null;
  if (directFullName || directNric) {
    return { fullName: directFullName ?? null, nric: directNric ?? null, raw: { text } };
  }
  return extractFields(text);
}

async function recognizeWithMock(_imageBase64: string) {
  // Fast deterministic mock for development
  const fullName = process.env.MOCK_FULLNAME || 'JOHN DOE';
  const nric = process.env.MOCK_NRIC || '880705-56-5975';
  const text = `${fullName}\nNRIC ${nric}`;
  return { fullName, nric, raw: { text } };
}

function extractFields(text: string) {
  let fullName: string | null = null;
  let nric: string | null = null;
  const nricMatch = text.match(/\b\d{6}-\d{2}-\d{4}\b/);
  if (nricMatch) nric = nricMatch[0];
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const candidate = lines
    .filter((line) => /^[A-Z'\-\s]{5,}$/.test(line))
    .sort((a, b) => b.length - a.length)[0];
  if (candidate) fullName = candidate;
  return { fullName, nric, raw: { text } };
}
