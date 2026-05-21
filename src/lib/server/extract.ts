import { normalizeDocDate } from '$lib/dates';

import type { ExtractionResult } from '$lib/types';



const EXTRACTION_SCHEMA = `{

  "vendor": "merchant or store name or null",

  "date": "ISO date YYYY-MM-DD or null",

  "total": "number grand total or null",

  "currency": "ISO 4217 code like IDR, USD, SGD or null",

  "line_items": [{"description":"string","quantity":number|null,"unit_price":number|null,"amount":number|null}],

  "confidence": {"vendor":0-1,"date":0-1,"total":0-1,"currency":0-1,"line_items":0-1},

  "warnings": ["human-readable issues"],

  "is_financial_document": true|false

}`;



export async function extractFromImage(

  imageBase64: string,

  mimeType: string,

  apiKey: string

): Promise<ExtractionResult> {

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;



  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {

    method: 'POST',

    headers: {

      Authorization: `Bearer ${apiKey}`,

      'Content-Type': 'application/json',

      'HTTP-Referer': 'https://smart-document-reader.pages.dev',

      'X-Title': 'Smart Document Reader'

    },

    body: JSON.stringify({

      model: 'google/gemini-2.0-flash-001',

      temperature: 0.1,

      response_format: { type: 'json_object' },

      messages: [

        {

          role: 'system',

          content: `You extract structured data from receipt/invoice photos.

Return ONLY valid JSON matching this schema: ${EXTRACTION_SCHEMA}

Rules:

- Lower confidence (0.0-0.4) when text is blurry, rotated, dark, or ambiguous.

- Add warnings for: not a receipt, poor image quality, missing totals, multiple currencies.

- If not a financial document, set is_financial_document false and leave fields null with warnings.

- Parse dates to YYYY-MM-DD. Infer currency from symbols (Rp→IDR, $→USD) or context.

- line_items: empty array if none visible.`

        },

        {

          role: 'user',

          content: [

            {

              type: 'text',

              text: 'Extract all fields from this document image. Be conservative with confidence scores.'

            },

            { type: 'image_url', image_url: { url: dataUrl } }

          ]

        }

      ]

    })

  });



  if (!response.ok) {

    const errText = await response.text();

    throw new Error(`OpenRouter error ${response.status}: ${errText.slice(0, 300)}`);

  }



  const json = (await response.json()) as {

    choices?: { message?: { content?: string } }[];

  };

  const content = json.choices?.[0]?.message?.content;

  if (!content) throw new Error('Empty AI response');



  const parsed = JSON.parse(content) as ExtractionResult & {

    date?: string | null;

    confidence?: ExtractionResult['confidence'];

  };



  return {

    vendor: parsed.vendor ?? null,

    date: normalizeDocDate(parsed.date ?? null),

    total: parsed.total != null ? Number(parsed.total) : null,

    currency: parsed.currency ?? null,

    line_items: Array.isArray(parsed.line_items) ? parsed.line_items : [],

    confidence: parsed.confidence ?? {},

    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],

    is_financial_document: parsed.is_financial_document !== false

  };

}



export function lowConfidenceFields(confidence: ExtractionResult['confidence']): string[] {

  const fields: string[] = [];

  const threshold = 0.65;

  for (const [key, val] of Object.entries(confidence)) {

    if (typeof val === 'number' && val < threshold) fields.push(key);

  }

  return fields;

}


