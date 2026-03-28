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
        const response = await fetch("https://openrouter.ai/api/v1/credits", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            },
        });

        if (!response.ok) {
            return new Response('Error fetching credits', { status: response.status });
        }

        const data = await response.json();
        const balance = data.data.total_credits - data.data.total_usage;

        // Daily Hard Cap Logic ($2.00)
        const activityRes = await fetch("https://openrouter.ai/api/v1/activity", {
            headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}` }
        });
        const activityData = await activityRes.json();
        const todayStr = new Date().toISOString().split('T')[0];
        let todayUsage = 0;
        if (activityData.data) {
            activityData.data.forEach(item => {
                if (item.date === todayStr) todayUsage += (item.usage || 0);
            });
        }

        const cappedBalance = (todayUsage >= 2.0) ? 0 : balance;
        
        return new Response(JSON.stringify({
            credits: cappedBalance,
            todayUsage: todayUsage
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response('Server Error', { status: 500 });
    }
};

export const config = {
    path: "/api/credits"
};
