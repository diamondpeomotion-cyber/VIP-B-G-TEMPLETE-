/**
 * Server-side Gemini AI endpoints.
 *
 * Used by the legacy SalonOS demo (no extra context → original Royal Tresses
 * prompts & fallbacks) and by each white-label salon's public website, which
 * supplies its own name + service catalog so the consultant answers with
 * that salon's real services.
 *
 * Reliability contract: these endpoints NEVER hard-fail because the AI
 * provider is down, slow, misconfigured, or returns malformed JSON. Every
 * failure path logs a structured error server-side and returns a curated
 * local fallback with `fallback: true` so the UI can say so honestly.
 */
import { Router } from 'express';
import { Type } from '@google/genai';
import { getGeminiClient } from './gemini';
import { logError } from './http';

export const aiRouter = Router();

interface ServiceCtxItem {
  id: string;
  name: string;
  price?: number;
  category?: string;
}

function clamp(v: unknown, max: number, fallback = ''): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : fallback;
}

function isValidConsultResult(v: any): boolean {
  return (
    !!v &&
    Array.isArray(v.styles) &&
    v.styles.length > 0 &&
    typeof v.overallAdvice === 'string' &&
    v.styles.every(
      (s: any) =>
        s && typeof s.name === 'string' && typeof s.description === 'string' &&
        typeof s.matchedServiceId === 'string' && typeof s.reasoning === 'string'
    )
  );
}

function isValidCampaign(v: any): boolean {
  return (
    !!v &&
    typeof v.title === 'string' &&
    typeof v.copy === 'string' &&
    typeof v.promoCode === 'string' &&
    typeof v.discountValue === 'string'
  );
}

// ---------------------------------------------------------------------------
// Curated local fallbacks (also used when no API key is configured)
// ---------------------------------------------------------------------------

function whiteLabelConsultFallback(opts: {
  salonName: string;
  catalog: ServiceCtxItem[];
  hairTexture: string;
  facialShape: string;
  styleGoals: string;
}) {
  const { salonName, catalog, hairTexture, facialShape, styleGoals } = opts;
  const top = catalog.slice(0, 2);
  return {
    fallback: true,
    styles: top.map((s, i) => ({
      name: s.name,
      description: `A signature ${s.category || 'salon'} ritual at ${salonName}, curated for ${facialShape || 'your'} features and ${hairTexture} texture.`,
      matchedServiceId: s.id,
      reasoning:
        i === 0
          ? `Best direct match for your goal of "${styleGoals}".`
          : 'Complements the look beautifully and maintains long-term hair health.',
    })),
    overallAdvice: `Namaste from ${salonName}! For ${hairTexture} hair with ${facialShape || 'oval'} features, our stylists recommend starting with “${top[0]?.name || 'a signature consultation'}” and pairing it with regular nourishing rituals. Book a session — our team will personalize the experience for you.`,
    recommendedStylistId: '',
  };
}

function demoConsultFallback(lengthPreference: string, hairTexture: string, facialShape: string, styleGoals: string) {
  const mockAdvice = `Namaste! As your Royal Tresses Jaipur hair & wellness consultant:
For dynamic hair texture of "${hairTexture}" with "${facialShape || 'Oval'}" facial contours:
1. **Moroccan Argan Hair Spa**: Restores deep moisture, tames frizz caused by dry Rajasthan weather, and coats hair strands with organic gloss.
2. **Signature Precision Cut with Face-Framing Layers**: Accentuates your ${facialShape || 'Oval'} structure while maintaining rich Indian volume.

We recommend booking Aarav Sharma at C-Scheme or Priya Sen for your bespoke session.`;

  return {
    fallback: true,
    styles: [
      {
        name: lengthPreference === 'short' ? 'Royal Feathered Shag' : 'Silk Layered Cut with Royal Blow-Dry',
        description: `A customized precision cut tailored to balance ${facialShape || 'Oval'} facial geometry and enhance natural ${hairTexture} loops.`,
        matchedServiceId: 's-1',
        reasoning: `Your ${styleGoals} preference aligns with Aarav Sharma's architectural precision layering.`,
      },
      {
        name: 'Moroccan Argan Hair Spa & Scalp Detox',
        description: 'Deep hair hydration and scalp champi with warm botanical oils.',
        matchedServiceId: 's-2',
        reasoning: 'Rehydrates hair cuticles from seasonal weather and delivers brilliant glossy radiance.',
      },
    ],
    overallAdvice: mockAdvice,
    recommendedStylistId: 'sty-1',
  };
}

function marketingFallback(opts: {
  salonName?: string;
  city?: string;
  slowHour?: string;
  activePromotion?: string;
  targetAudience?: string;
}) {
  const brand = opts.salonName || 'Royal Tresses Jaipur';
  const location = opts.city || 'Jaipur';
  return {
    fallback: true,
    title: `${opts.activePromotion || 'Royal Festive Glow'} Mid-Week Campaign`,
    channel: 'sms',
    subject: `Royal Rewards Await You at ${brand}`,
    copy: `✨ ${brand} VIP Invite: Transform your ${opts.slowHour || 'Tuesday afternoon'} into a regal pampering session. Enjoy flat ₹500 OFF on Hair Spa & Gold Facials with code GLOW500. Slots strictly by appointment${opts.city ? ` in ${location}` : ' in Jaipur'}!`,
    promoCode: 'GLOW500',
    discountValue: '₹500 OFF',
    targetAudience: opts.targetAudience || `${location} regular clients and wedding guests`,
  };
}

// ---------------------------------------------------------------------------
// Gemini AI Business Assistance and Hair Portrait Consultation
// ---------------------------------------------------------------------------
aiRouter.post('/api/ai/consult', async (req, res) => {
  const hairTexture = clamp(req.body?.hairTexture, 200);
  const facialShape = clamp(req.body?.facialShape, 100, 'Oval');
  const styleGoals = clamp(req.body?.styleGoals, 500);
  const lengthPreference = clamp(req.body?.lengthPreference, 60, 'Medium');
  const salonName = clamp(req.body?.salonName, 120);
  const servicesCtx = Array.isArray(req.body?.servicesCtx)
    ? (req.body.servicesCtx as ServiceCtxItem[]).slice(0, 20).map((s) => ({
        id: clamp(s?.id, 80),
        name: clamp(s?.name, 150, 'Salon service'),
        price: typeof s?.price === 'number' ? s.price : undefined,
        category: clamp(s?.category, 60),
      }))
    : [];

  if (!hairTexture || !styleGoals) {
    return res.status(400).json({ error: 'Missing critical hair assessment answers' });
  }

  const isWhiteLabel = !!salonName && servicesCtx.length > 0;
  const client = getGeminiClient();

  if (!client) {
    // No API key configured — serve the curated local experience.
    return res.json(
      isWhiteLabel
        ? whiteLabelConsultFallback({ salonName, catalog: servicesCtx, hairTexture, facialShape, styleGoals })
        : demoConsultFallback(lengthPreference, hairTexture, facialShape, styleGoals)
    );
  }

  try {
    let prompt: string;
    if (isWhiteLabel) {
      const catalogLines = servicesCtx
        .map((s) => `- id: "${s.id}" | ${s.name} (${s.category || 'service'}${s.price ? `, ₹${s.price}` : ''})`)
        .join('\n');
      prompt = `You are ${salonName} AI, a warm, professional luxury salon stylist consultant embedded on the salon's own website.
Analyze this client profile:
- Hair Texture: ${hairTexture}
- Facial Structure Shape: ${facialShape || 'Standard Oval'}
- Personal Style Goals: ${styleGoals}
- Length Preference: ${lengthPreference || 'No preference'}

The salon's actual service catalog is:
${catalogLines}

Respond strictly in JSON format matching this schema:
{
  "styles": [
    {
      "name": "Recommended service or style name (from the catalog above whenever possible)",
      "description": "Short explanation of the style",
      "matchedServiceId": "The id of the most relevant catalog service",
      "reasoning": "Explain why this matches their facial shape and hair texture"
    }
  ],
  "overallAdvice": "A warm greeting from ${salonName}, advising on hair wellness and daily care tailored to the client",
  "recommendedStylistId": ""
}`;
    } else {
      prompt = `You are Royal Tresses AI, a highly prestigious luxury Indian salon, bridal, and skin esthetician consultant for Royal Tresses Salon & Spa in Jaipur, Rajasthan.
    Analyze this client profile:
    - Hair Texture: ${hairTexture}
    - Facial Structure Shape: ${facialShape || 'Standard Oval'}
    - Personal Style Goals: ${styleGoals}
    - Length Preference: ${lengthPreference || 'No preference'}

    Respond strictly in JSON format matching this schema:
    {
      "styles": [
        {
          "name": "Recommended haircut or style name",
          "description": "Short explanation of the style",
          "matchedServiceId": "Return s-1, s-2, s-4, or s-6 depending on matches to hair and bridal services",
          "reasoning": "Explain why this matches their facial shape and hair texture"
        }
      ],
      "overallAdvice": "A warm, respectful Indian hospitality greeting welcoming the client, advising on hair spa wellness, Ayurvedic hair oils, and daily care routines in Jaipur climate",
      "recommendedStylistId": "Recommend one of: sty-1 (Aarav Sharma), sty-2 (Priya Sen), sty-3 (Rohan Verma), sty-4 (Sneha Kapoor)"
    }`;
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            styles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  matchedServiceId: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                },
                required: ['name', 'description', 'matchedServiceId', 'reasoning'],
              },
            },
            overallAdvice: { type: Type.STRING },
            recommendedStylistId: { type: Type.STRING },
          },
          required: ['styles', 'overallAdvice', 'recommendedStylistId'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '').trim());
    if (!isValidConsultResult(parsed)) {
      throw new Error('AI returned an unexpected shape');
    }
    res.json({ fallback: false, ...parsed });
  } catch (error: unknown) {
    // Provider outage / quota / malformed output → log + curated fallback.
    logError('ai.consult', error, { whiteLabel: isWhiteLabel });
    res.json(
      isWhiteLabel
        ? whiteLabelConsultFallback({ salonName, catalog: servicesCtx, hairTexture, facialShape, styleGoals })
        : demoConsultFallback(lengthPreference, hairTexture, facialShape, styleGoals)
    );
  }
});

// ---------------------------------------------------------------------------
// Marketing AI and Business Analytics Insights
// ---------------------------------------------------------------------------
aiRouter.post('/api/ai/marketing', async (req, res) => {
  const slowHour = clamp(req.body?.slowHour, 200);
  const activePromotion = clamp(req.body?.activePromotion, 200);
  const targetAudience = clamp(req.body?.targetAudience, 200);
  const salonName = clamp(req.body?.salonName, 120);
  const city = clamp(req.body?.city, 120);

  const client = getGeminiClient();

  if (!client) {
    return res.json(marketingFallback({ salonName, city, slowHour, activePromotion, targetAudience }));
  }

  try {
    const brand = salonName || 'Royal Tresses';
    const location = city || 'Jaipur';
    const prompt = `You are ${brand} Executive AI, a luxury marketing strategist for a premier salon in ${location}, India.
    Generate a highly creative, persuasive marketing campaign in Indian English targeting:
    - Target Slow Hour Period: ${slowHour || 'Tuesday Afternoons'}
    - Selected Service/Promo: ${activePromotion || 'Signature Hair Spa / Facial'}
    - Targeted Audience: ${targetAudience || 'Loyal clientele & celebration parties'}

    Return JSON matching:
    {
      "title": "Campaign title",
      "channel": "sms or email or instagram",
      "subject": "Email Subject Line if applicable (optional)",
      "copy": "Engaging, luxury salon message mentioning ${location}, with promo code and direct booking call to action.",
      "promoCode": "Generative unique promo code (e.g. ${location.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'CITY'}GLOW)",
      "discountValue": "Discount amount in INR or percentage (e.g. ₹500 OFF or 20% OFF)",
      "targetAudience": "Description of targeted clientele segment in ${location}"
    }`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            channel: { type: Type.STRING },
            subject: { type: Type.STRING },
            copy: { type: Type.STRING },
            promoCode: { type: Type.STRING },
            discountValue: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
          },
          required: ['title', 'channel', 'copy', 'promoCode', 'discountValue', 'targetAudience'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '').trim());
    if (!isValidCampaign(parsed)) {
      throw new Error('AI returned an unexpected campaign shape');
    }
    res.json({ fallback: false, ...parsed });
  } catch (error: unknown) {
    logError('ai.marketing', error, {});
    res.json(marketingFallback({ salonName, city, slowHour, activePromotion, targetAudience }));
  }
});
