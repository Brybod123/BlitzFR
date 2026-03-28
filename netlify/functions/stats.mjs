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

        // Calculate average tokens from recent activity
        let totalTokens = 0;
        let totalRequests = 0;
        if (activityData.data && Array.isArray(activityData.data)) {
            activityData.data.forEach(item => {
                totalTokens += (item.prompt_tokens || 0) + (item.completion_tokens || 0);
                totalRequests += (item.requests || 0);
            });
        }
        const avgTokens = totalRequests > 0 ? (totalTokens / totalRequests) : 1000; // default to 1k

        // Map prices for relevant models
        const relevantModels = [
            "qwen/qwen-2.5-72b-instruct",
            "inception/mercury-2",
            "xiaomi/mimo-v2-omni",
            "openai/gpt-5.4-nano"
        ];
        
        const prices = {};
        if (modelsData.data) {
            modelsData.data.forEach(m => {
                if (relevantModels.includes(m.id)) {
                    prices[m.id] = (m.pricing.prompt + m.pricing.completion) / 2;
                }
            });
        }

        return new Response(JSON.stringify({
            avgTokens,
            prices
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response('Server Error', { status: 500 });
    }
};

export const config = {
    path: "/api/stats"
};
