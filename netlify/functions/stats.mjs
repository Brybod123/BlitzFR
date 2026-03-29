export default async (req, context) => {
    // Support both Node fallback and Netlify Edge logic
    let OPENROUTER_API_KEY = "";
    if (typeof process !== 'undefined' && process.env.OPENROUTER_API_KEY) {
        OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    } else if (typeof Netlify !== 'undefined') {
        OPENROUTER_API_KEY = Netlify.env.get("OPENROUTER_API_KEY");
    }

    if (!OPENROUTER_API_KEY) {
        return new Response('API Key not set', { status: 500 });
    }

    try {
        // Fetch activity
        const activityRes = await fetch("https://openrouter.ai/api/v1/activity", {
            headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}` }
        });
        const activityData = await activityRes.json();

        // Fetch models
        const modelsRes = await fetch("https://openrouter.ai/api/v1/models", {
            headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}` }
        });
        const modelsData = await modelsRes.json();

        let totalTokens = 0;
        let totalRequests = 0;
        let accountTokens = 0;
        let accountRequests = 0;
        
        if (activityData.data && Array.isArray(activityData.data)) {
            const relevantModels = [
                "qwen/qwen3.5-flash-02-23",
                "inception/mercury-2",
                "xiaomi/mimo-v2-omni",
                "openai/gpt-5.4-nano",
                "moonshotai/kimi-k2.5",
                "kwaipilot/kat-coder-pro-v2",
                "x-ai/grok-code-fast-1",
                "google/gemini-3.1-flash-lite-preview",
                "google/gemini-3-flash-preview",
                "openai/gpt-oss-120b",
                "xiaomi/mimo-v2-flash",
                "xiaomi/mimo-v2-pro"
            ];

            activityData.data.forEach(item => {
                const prompt = (item.prompt_tokens || 0);
                const completion = (item.completion_tokens || 0);
                const count = (item.requests || 0);
                
                accountTokens += (prompt + completion);
                accountRequests += count;

                const isRelevantModel = relevantModels.some(rm => (item.model_permaslug || item.model || "").includes(rm));
                if (isRelevantModel) {
                    totalTokens += (prompt + completion);
                    totalRequests += count;
                }
            });
        }
        
        const finalTokens = (totalRequests > 0) ? totalTokens : accountTokens;
        const finalRequests = (totalRequests > 0) ? totalRequests : accountRequests;
        const avgTokens = finalRequests > 0 ? (finalTokens / finalRequests) : 4000;

        // Map prices for relevant models
        const relevantModels = [
            "qwen/qwen3.5-flash-02-23",
            "inception/mercury-2",
            "xiaomi/mimo-v2-omni",
            "openai/gpt-5.4-nano",
            "moonshotai/kimi-k2.5",
            "kwaipilot/kat-coder-pro-v2",
            "x-ai/grok-code-fast-1",
            "google/gemini-3.1-flash-lite-preview",
            "google/gemini-3-flash-preview",
            "openai/gpt-oss-120b",
            "xiaomi/mimo-v2-flash",
            "xiaomi/mimo-v2-pro"
        ];
        
        const prices = {};
        if (modelsData.data) {
            modelsData.data.forEach(m => {
                if (relevantModels.some(rm => m.id.includes(rm) || rm.includes(m.id))) {
                    const promptPrice = parseFloat(m.pricing.prompt) || 0;
                    const completionPrice = parseFloat(m.pricing.completion) || 0;
                    prices[relevantModels.find(rm => m.id.includes(rm) || rm.includes(m.id))] = (promptPrice + completionPrice) / 2;
                }
            });
        }

        return new Response(JSON.stringify({
            avgTokens,
            prices
        }), {
            headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "no-store, max-age=0"
            }
        });
    } catch (err) {
        return new Response('Server Error', { status: 500 });
    }
};

export const config = {
    path: "/api/stats"
};
