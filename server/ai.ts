/**
 * Server-side Gemini AI endpoints.
 *
 * Used by the legacy SalonOS demo (no extra context → original Royal Tresses
 * prompts & fallbacks) and by each white-label salon's public website, which
 * supplies its own name + service catalog so the consultant answers with
 * that salon's real services.
 */
import { Router } from 'express';
import { Type } from '@google/genai';
import { getGeminiClient } from './gemini';

export const aiRouter = Router();

interface ServiceCtxItem {
  id: string;
  name: string;
  price?: number;
  category?: string;
}

// Gemini AI Business Assistance and Hair Portrait Consultation
aiRouter.post('/api/ai/consult', async (req, res) => {
  const { hairTexture, facialShape, styleGoals, lengthPreference, salonName, servicesCtx } = req.body as {
    hairTexture?: string;
    facialShape?: string;
    styleGoals?: string;
    lengthPreference?: string;
    salonName?: string;
    servicesCtx?: ServiceCtxItem[];
  };

  if (!hairTexture || !styleGoals) {
    return res.status(400).json({ error: 'Missing critical hair assessment answers' });
  }

  const client = getGeminiClient();
  const isWhiteLabel = !!salonName && Array.isArray(servicesCtx) && servicesCtx.length > 0;
  const catalog = (servicesCtx || []).slice(0, 20);

  if (!client) {
    // Simulation fallbacks when API key isn't provided
    if (isWhiteLabel) {
      const top = catalog.slice(0, 2);
      return res.json({
        styles: top.map((s, i) => ({
          name: s.name,
          description: `A signature ${s.category || 'salon'} ritual at ${salonName}, curated for ${facialShape || 'your'} features and ${hairTexture} texture.`,
          matchedServiceId: s.id,
          reasoning: i === 0
            ? `Best direct match for your goal of "${styleGoals}".`
            : `Complements the look beautifully and maintains long-term hair health.`,
        })),
        overallAdvice: `Namaste from ${salonName}! For ${hairTexture} hair with ${facialShape || 'oval'} features, our stylists recommend starting with “${top[0]?.name || 'a signature consultation'}” and pairing it with regular nourishing rituals. Book a session — our team will personalize the experience for you.`,
        recommendedStylistId: '',
      });
    }
    const mockAdvice = `Namaste! As your Royal Tresses Jaipur hair & wellness consultant:
For dynamic hair texture of "${hairTexture}" with "${facialShape || 'Oval'}" facial contours:
1. **Moroccan Argan Hair Spa**: Restores deep moisture, tames frizz caused by dry Rajasthan weather, and coats hair strands with organic gloss.
2. **Signature Precision Cut with Face-Framing Layers**: Accentuates your ${facialShape || 'Oval'} structure while maintaining rich Indian volume.

We recommend booking Aarav Sharma at C-Scheme or Priya Sen for your bespoke session.`;

    return res.json({
      styles: [
        {
          name: lengthPreference === 'short' ? 'Royal Feathered Shag' : 'Silk Layered Cut with Royal Blow-Dry',
          description: `A customized precision cut tailored to balance ${facialShape || 'Oval'} facial geometry and enhance natural ${hairTexture} loops.`,
          matchedServiceId: 's-1',
          reasoning: `Your ${styleGoals} preference aligns with Aarav Sharma's architectural precision layering.`
        },
        {
          name: 'Moroccan Argan Hair Spa & Scalp Detox',
          description: 'Deep hair hydration and scalp champi with warm botanical oils.',
          matchedServiceId: 's-2',
          reasoning: 'Rehydrates hair cuticles from seasonal weather and delivers brilliant glossy radiance.'
        }
      ],
      overallAdvice: mockAdvice,
      recommendedStylistId: 'sty-1'
    });
  }

  try {
    let prompt: string;
    if (isWhiteLabel) {
      const catalogLines = catalog
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
                  reasoning: { type: Type.STRING }
                },
                required: ['name', 'description', 'matchedServiceId', 'reasoning']
              }
            },
            overallAdvice: { type: Type.STRING },
            recommendedStylistId: { type: Type.STRING }
          },
          required: ['styles', 'overallAdvice', 'recommendedStylistId']
        }
      }
    });

    const jsonText = response.text.trim();
    res.json(JSON.parse(jsonText));

  } catch (error: any) {
    res.status(500).json({ error: 'AI generation failed', message: error.message });
  }
});

// Marketing AI and Business Analytics Insights
aiRouter.post('/api/ai/marketing', async (req, res) => {
  const { slowHour, activePromotion, targetAudience, salonName, city } = req.body as {
    slowHour?: string;
    activePromotion?: string;
    targetAudience?: string;
    salonName?: string;
    city?: string;
  };

  const client = getGeminiClient();

  if (!client) {
    const brand = salonName || 'Royal Tresses Jaipur';
    const location = city || 'Jaipur';
    return res.json({
      title: `${activePromotion || 'Royal Festive Glow'} Mid-Week Campaign`,
      channel: 'sms',
      subject: `Royal Rewards Await You at ${brand}`,
      copy: `✨ ${brand} VIP Invite: Transform your ${slowHour || 'Tuesday afternoon'} into a regal pampering session. Enjoy flat ₹500 OFF on Hair Spa & Gold Facials with code GLOW500. Slots strictly by appointment${city ? ` in ${location}` : ' in Jaipur'}!`,
      promoCode: 'GLOW500',
      discountValue: '₹500 OFF',
      targetAudience: targetAudience || `${location} regular clients and wedding guests`
    });
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
            targetAudience: { type: Type.STRING }
          },
          required: ['title', 'channel', 'copy', 'promoCode', 'discountValue', 'targetAudience']
        }
      }
    });

    const jsonText = response.text.trim();
    res.json(JSON.parse(jsonText));

  } catch (error: any) {
    res.status(500).json({ error: 'AI generation failed', message: error.message });
  }
});
