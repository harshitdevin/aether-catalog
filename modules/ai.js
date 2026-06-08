/* ==========================================================================
   AetherCatalog AI Visual Analysis & API Client Module
   ========================================================================== */

const GEMINI_MODEL = 'gemini-2.5-flash';
const API_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Advanced System Instructions to ensure Gemini returns strict JSON mapping
const SYSTEM_INSTRUCTION = `
You are an expert AI system for automated asset registry and inventory cataloguing in an enterprise warehouse/office.
Your task is to analyze the uploaded image of a physical asset and return a strict, clean JSON object. 
Do not include any explanation or markdown formatting (such as \`\`\`json). Just return raw JSON.

Return the following schema:
{
  "name": "Specific brand and model of the asset seen in the image",
  "category": "Map to one of these: Electronics, Office Gear, Media Equipment, Laboratory, or a suitable custom one if none match",
  "value": 249900.00, // Estimated secondary market valuation or MSRP in INR (as float/number, no currency symbols)
  "manufacturer": "Company that manufactured the asset",
  "model": "Estimated model number or series name if visible, otherwise null",
  "condition": "Estimate physical condition: Excellent, Good, Fair, or Poor",
  "tags": ["comma", "separated", "lowercase", "descriptive", "tags"],
  "notes": "Provide a concise bulleted detail of visual observations (e.g., color, visible ports, cosmetic wear, labels)",
  "detectedObjects": [
    {
      "label": "Asset Type",
      "box_2d": [ymin, xmin, ymax, xmax], // Bounding box coordinates as integer percentages (0 to 100) representing [top, left, bottom, right] relative to the image borders
      "confidence": 0.98 // Confidence score from 0.0 to 1.0
    }
  ]
}
`;

export const AIClient = {
  // Checks if API Key is saved in browser storage
  getApiKey() {
    return localStorage.getItem('aether_gemini_key') || '';
  },

  setApiKey(key) {
    if (key) {
      localStorage.setItem('aether_gemini_key', key.trim());
      return true;
    }
    return false;
  },

  clearApiKey() {
    localStorage.removeItem('aether_gemini_key');
  },

  isLiveMode() {
    return this.getApiKey() !== '';
  },

  // Dispatches vision request based on API key availability
  async analyzeAssetImage(base64Data, mimeType) {
    const apiKey = this.getApiKey();
    
    if (apiKey) {
      return this.executeLiveGeminiAnalysis(apiKey, base64Data, mimeType);
    } else {
      return this.executeSimulatedAnalysis(base64Data);
    }
  },

  // Perform live API call directly to Google Gemini 2.5 Flash REST endpoint
  async executeLiveGeminiAnalysis(apiKey, base64Data, mimeType) {
    // Strip header metadata from base64 if present
    const rawBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    
    const requestUrl = `${API_URL_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${SYSTEM_INSTRUCTION}\n\nAnalyze this asset image:`
            },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: rawBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No analysis candidate returned by Gemini API.");
      }

      const rawText = data.candidates[0].content.parts[0].text;
      
      // Clean raw text to ensure it's pure JSON
      let cleanJsonText = rawText.trim();
      if (cleanJsonText.startsWith('```')) {
        cleanJsonText = cleanJsonText.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanJsonText);
      return parsed;

    } catch (error) {
      console.error("Gemini API request failed:", error);
      throw error;
    }
  },

  // Perform premium fallback simulation with object detection coordinates
  executeSimulatedAnalysis(base64Data) {
    return new Promise((resolve) => {
      // Simulate real AI network and compute lag of 2.2 seconds
      setTimeout(() => {
        // High-fidelity asset classification based on image complexity or random seed mapping
        const simulatedMockups = [
          {
            name: 'Aether Book Studio 14"',
            category: 'Electronics',
            value: 165000.00,
            manufacturer: 'AetherTech',
            model: 'ABS-14-M2',
            condition: 'Excellent',
            tags: ['laptop', 'hardware', 'mobile', 'silicon'],
            notes: 'High-fidelity dark-grey metallic finish. Sleek design, glossy display. Power adapter included.',
            detectedObjects: [
              {
                label: 'Laptop (96%)',
                box_2d: [15, 10, 85, 90],
                confidence: 0.96
              }
            ]
          },
          {
            name: 'Sleek Poly-Posture Office Chair',
            category: 'Office Gear',
            value: 25000.00,
            manufacturer: 'SteelForm',
            model: 'PolyPosture-V1',
            condition: 'Good',
            tags: ['furniture', 'office', 'ergonomic'],
            notes: 'Black nylon mesh structure with steel hydraulic base. Five-caster base in good condition.',
            detectedObjects: [
              {
                label: 'Office Chair (92%)',
                box_2d: [10, 25, 90, 75],
                confidence: 0.92
              }
            ]
          },
          {
            name: 'Aether Studio Recording Mic',
            category: 'Media Equipment',
            value: 35000.00,
            manufacturer: 'Shur',
            model: 'AETHER-SM7B',
            condition: 'Excellent',
            tags: ['microphone', 'audio', 'podcast', 'recording'],
            notes: 'Professional dynamic broadcast microphone. Attached to steel desk mounting arm. Matte black finish.',
            detectedObjects: [
              {
                label: 'Microphone (94%)',
                box_2d: [20, 30, 80, 70],
                confidence: 0.94
              }
            ]
          },
          {
            name: 'UltraWide Curved Monitor 34"',
            category: 'Electronics',
            value: 45000.00,
            manufacturer: 'DisplayCorp',
            model: 'DC-34C-UW',
            condition: 'Good',
            tags: ['monitor', 'screen', 'hardware', 'display'],
            notes: 'Curved IPS display panel. Multiple HDMI and DisplayPort inputs. Minor superficial scuff on plastic casing.',
            detectedObjects: [
              {
                label: 'Monitor (97%)',
                box_2d: [20, 5, 80, 95],
                confidence: 0.97
              }
            ]
          }
        ];

        // Pick one randomly
        const selected = simulatedMockups[Math.floor(Math.random() * simulatedMockups.length)];
        
        // Match the base64 input image in the final response
        selected.image = base64Data;
        resolve(selected);
      }, 2200);
    });
  },

  // Validates API key against Gemini API with a cheap sample request
  async validateApiKey(key) {
    const testUrl = `${API_URL_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`;
    const testBody = {
      contents: [
        {
          parts: [{ text: "Respond with the word 'SUCCESS' if you read this." }]
        }
      ]
    };

    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testBody)
      });

      if (!response.ok) return false;
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text.toUpperCase().includes('SUCCESS');
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  // Dispatches transcript text-parsing request
  async parseSpokenText(text) {
    const apiKey = this.getApiKey();
    if (apiKey) {
      return this.executeLiveGeminiTextParsing(apiKey, text);
    } else {
      return this.executeSimulatedTextParsing(text);
    }
  },

  // Calls Gemini API to parse spoken sentences into structured JSON attributes
  async executeLiveGeminiTextParsing(apiKey, text) {
    const requestUrl = `${API_URL_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    const parsingInstruction = `
    You are an expert AI system for automated inventory metadata extraction.
    Your task is to analyze the transcribed spoken text describing a corporate asset and return a strict, clean JSON object matching the inventory schema.
    If some details are not specified, please fill them with logical default values (e.g. status: "In Service", condition: "Good", location: "Main Storage", manufacturer: try to infer from name, tags: infer from name/category).
    Do not include any explanation or markdown formatting (such as \`\`\`json). Just return raw JSON.

    Return the following schema:
    {
      "name": "Specific brand and model of the asset",
      "category": "Map to one of: Electronics, Office Gear, Media Equipment, Laboratory, or custom",
      "value": 25000.00, // Estimated value as float in INR (no currency symbols)
      "manufacturer": "Company that manufactured it, or null if unknown",
      "model": "Model number or series name, or null if unknown",
      "condition": "Physical condition: Excellent, Good, Fair, or Poor",
      "status": "In Service, Storage, Maintenance, or Disposed",
      "location": "Location name or null if unknown",
      "serial": "Serial number or asset tag, or null if unknown",
      "tags": ["lowercase", "descriptive", "tags"],
      "notes": "Concise summary of observations, serial numbers, or description"
    }
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${parsingInstruction}\n\nAnalyze this spoken description: "${text}"`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      let cleanJsonText = rawText.trim();
      if (cleanJsonText.startsWith('```')) {
        cleanJsonText = cleanJsonText.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
      }

      return JSON.parse(cleanJsonText);
    } catch (error) {
      console.error("Gemini text parsing failed, falling back to local NLP:", error);
      return this.executeSimulatedTextParsing(text);
    }
  },

  // Local fallback parsing using regex-based extraction
  executeSimulatedTextParsing(text) {
    const clean = text.toLowerCase().trim();
    
    let name = "Unknown Asset";
    let category = "Electronics";
    let value = 15000.00;
    let condition = "Good";
    let status = "In Service";
    let location = "Main Storage";
    let manufacturer = null;
    let model = null;
    let serial = null;
    let tags = [];
    let notes = "Voice dictation parsed locally.";

    if (clean.includes('laptop') || clean.includes('macbook') || clean.includes('computer')) {
      name = clean.includes('macbook') ? "MacBook Pro" : "Desktop Computer";
      category = "Electronics";
      manufacturer = clean.includes('macbook') ? "Apple" : null;
    } else if (clean.includes('chair') || clean.includes('desk') || clean.includes('table')) {
      name = clean.includes('chair') ? "Office Chair" : "Workstation Desk";
      category = "Office Gear";
    }

    const numRegex = /\d+/g;
    const matches = clean.match(numRegex);
    if (matches && matches.length > 0) {
      value = parseFloat(matches[0]);
    }

    if (clean.includes('excellent') || clean.includes('pristine')) condition = 'Excellent';
    else if (clean.includes('fair') || clean.includes('used')) condition = 'Fair';
    else if (clean.includes('poor') || clean.includes('damaged')) condition = 'Poor';

    if (clean.includes('storage')) status = 'Storage';
    else if (clean.includes('maintenance')) status = 'Maintenance';

    const words = clean.split(' ');
    const locIdx = words.indexOf('in');
    if (locIdx > -1 && locIdx + 1 < words.length) {
      location = words.slice(locIdx + 1, locIdx + 3).join(' ');
    }

    return {
      name,
      category,
      value,
      manufacturer,
      model,
      condition,
      status,
      location,
      serial,
      tags,
      notes
    };
  },

  // Conversational Aether Assistant Chat
  async askAether(query, assets, sales) {
    const apiKey = this.getApiKey();
    if (apiKey) {
      return this.executeLiveAetherChat(apiKey, query, assets, sales);
    } else {
      return this.executeSimulatedAetherChat(query, assets, sales);
    }
  },

  async executeLiveAetherChat(apiKey, query, assets, sales) {
    const requestUrl = `${API_URL_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    // Clean data slightly to prevent payload size bloat (exclude raw base64 images from assets/sales data passed to LLM)
    const leanAssets = assets.map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      value: a.value,
      manufacturer: a.manufacturer,
      model: a.model,
      condition: a.condition,
      status: a.status,
      location: a.location,
      serial: a.serial,
      tags: a.tags,
      notes: a.notes,
      createdAt: a.createdAt
    }));

    const leanSales = sales.map(s => ({
      id: s.id,
      assetId: s.assetId,
      assetName: s.assetName,
      category: s.category,
      manufacturer: s.manufacturer,
      model: s.model,
      serial: s.serial,
      costValue: s.costValue,
      salePrice: s.salePrice,
      profit: s.profit,
      soldDate: s.soldDate,
      soldTo: s.soldTo,
      notes: s.notes
    }));

    const chatInstruction = `
    You are Aether, the intelligent voice and text assistant for AetherCatalog (an inventory management and sales registry system).
    You have access to the active catalog database (assets) and the sales ledger (sales).
    Your task is to answer the user's question based strictly on the provided JSON data.

    ACTIVE ASSETS in Inventory:
    \n${JSON.stringify(leanAssets)}\n

    SALES RECORD LEDGER:
    \n${JSON.stringify(leanSales)}\n

    Provide a helpful, concise response. Focus on giving direct answers (totals, specific locations, serials, sales amounts, or calculations).
    Keep the response brief (1-3 sentences) suitable for being read aloud.
    Do not reference database keys like "_id". Use user-friendly terms (e.g. refer to assets by their names, specify prices in INR with the ₹ symbol).
    If the user asks to filter/show/search/select something, suggest a UI action.
    Return a strict, clean JSON object matching this schema (do not include any explanation or markdown formatting like \`\`\`json):
    {
      "answer": "The text answer to be read aloud and displayed to the user.",
      "action": {
        "type": "redirect | select_asset | view_sale | none",
        "target": "dashboard | catalog | checkout | sales | settings | <asset_id> | <sale_id> | none",
        "searchQuery": "optional keyword to put in the search bar if redirecting to catalog/sales",
        "filterCategory": "optional category name to select if redirecting to catalog"
      }
    }
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${chatInstruction}\n\nUser Question: "${query}"`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      let cleanJsonText = rawText.trim();
      if (cleanJsonText.startsWith('```')) {
        cleanJsonText = cleanJsonText.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
      }

      return JSON.parse(cleanJsonText);
    } catch (error) {
      console.error("Aether Chat live request failed, falling back to simulation:", error);
      return this.executeSimulatedAetherChat(query, assets, sales);
    }
  },

  executeSimulatedAetherChat(query, assets, sales) {
    return new Promise((resolve) => {
      // Simulate real AI network lag of 1.2 seconds
      setTimeout(() => {
        const clean = query.toLowerCase().trim();
        let answer = "I couldn't find a specific answer in the local data. Try asking about total valuation, category details, or sales revenue.";
        let action = { type: "none", target: "none" };

        // 1. Check for valuation/category metrics
        if (clean.includes('valuation') || clean.includes('total value') || clean.includes('worth') || clean.includes('portfolio')) {
          const totalVal = assets.reduce((sum, a) => sum + parseFloat(a.value || 0), 0);
          const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalVal);
          answer = `The total estimated valuation of all assets in your inventory is ${formatted}.`;
          action = { type: "redirect", target: "dashboard" };
        } else if (clean.includes('revenue') || clean.includes('sales revenue') || clean.includes('total sales') || clean.includes('gross sales')) {
          const totalRev = sales.reduce((sum, s) => sum + parseFloat(s.salePrice || 0), 0);
          const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalRev);
          answer = `Your gross sales revenue is ${formatted} from ${sales.length} transactions.`;
          action = { type: "redirect", target: "sales" };
        } else if (clean.includes('profit') || clean.includes('net profit') || clean.includes('margin')) {
          const totalProfit = sales.reduce((sum, s) => sum + parseFloat(s.profit || 0), 0);
          const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalProfit);
          answer = `Your net profit across all sales is ${formatted}.`;
          action = { type: "redirect", target: "sales" };
        } else if (clean.includes('sold items') || clean.includes('how many items sold') || clean.includes('quantity sold')) {
          answer = `You have sold a total of ${sales.length} items.`;
          action = { type: "redirect", target: "sales" };
        } else if (clean.includes('expensive') || clean.includes('highest value') || clean.includes('costliest')) {
          if (assets.length > 0) {
            const sorted = [...assets].sort((a, b) => parseFloat(b.value || 0) - parseFloat(a.value || 0));
            const top = sorted[0];
            const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(top.value || 0);
            answer = `The most expensive asset is the "${top.name}" valued at ${formatted}, located in "${top.location || 'N/A'}".`;
            action = { type: "select_asset", target: top.id };
          } else {
            answer = "There are no assets catalogued in the database currently.";
          }
        } else if (clean.includes('location of') || clean.includes('where is')) {
          // Find asset
          const found = assets.find(a => clean.includes(a.name.toLowerCase()) || (a.serial && clean.includes(a.serial.toLowerCase())));
          if (found) {
            answer = `The ${found.name} (Serial: ${found.serial || 'N/A'}) is located in the ${found.location || 'Storage'}. Its condition is ${found.condition || 'Good'}.`;
            action = { type: "select_asset", target: found.id };
          } else {
            answer = "I couldn't find a matching active asset in the database. Try searching for MacBook, Chair, Camera, or a specific serial.";
          }
        } else if (clean.includes('show') || clean.includes('find') || clean.includes('search') || clean.includes('filter')) {
          // Identify category
          let filterCategory = 'all';
          let searchQuery = '';
          if (clean.includes('electronics') || clean.includes('laptop') || clean.includes('phone') || clean.includes('headset')) {
            filterCategory = 'Electronics';
          } else if (clean.includes('office') || clean.includes('chair') || clean.includes('furniture')) {
            filterCategory = 'Office Gear';
          } else if (clean.includes('camera') || clean.includes('media') || clean.includes('video')) {
            filterCategory = 'Media Equipment';
          } else if (clean.includes('lab') || clean.includes('microscope')) {
            filterCategory = 'Laboratory';
          }
          
          // Extract search query keyword
          const keywords = clean.split(/\b(?:show|find|search|filter)\b/i);
          if (keywords.length > 1) {
            searchQuery = keywords[1].replace(/(?:laptops|chairs|cameras|assets|category|electronics|office gear|media equipment|laboratory)/g, '').replace(/^\b(?:for|me|the|a|an)\b/gi, '').trim();
          }
          answer = `Displaying catalog filtered by category ${filterCategory} and keyword "${searchQuery}".`;
          action = { type: "redirect", target: "catalog", searchQuery, filterCategory };
        } else if (clean.includes('customer') || clean.includes('who bought') || clean.includes('sale to')) {
          const foundSale = sales.find(s => clean.includes(s.soldTo.toLowerCase()));
          if (foundSale) {
            const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(foundSale.salePrice || 0);
            answer = `${foundSale.soldTo} purchased the "${foundSale.assetName}" on ${new Date(foundSale.soldDate).toLocaleDateString()} for ${formatted}.`;
            action = { type: "view_sale", target: foundSale.id, searchQuery: foundSale.soldTo };
          } else {
            answer = "I couldn't find a transaction matching that customer name.";
          }
        }

        resolve({ answer, action });
      }, 1200);
    });
  }
};

