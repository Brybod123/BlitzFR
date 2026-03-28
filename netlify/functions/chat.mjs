export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // Support both Node fallback and Netlify Edge logic
    let OPENROUTER_API_KEY = "";
    if (typeof process !== 'undefined' && process.env.OPENROUTER_API_KEY) {
        OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    } else if (typeof Netlify !== 'undefined') {
        OPENROUTER_API_KEY = Netlify.env.get("OPENROUTER_API_KEY");
    }

    if (!OPENROUTER_API_KEY) {
        return new Response('Server Error: OPENROUTER_API_KEY environment variable is not set.', { status: 401 });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response('Bad Request', { status: 400 });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://github.com/Brybod123/BlitzFR",
                "X-Title": "Blitz IDE",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: body.model || "qwen/qwen-2.5-72b-instruct",
                messages: body.messages || [],
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API Error:", errorText);
            return new Response(`Upstream API error: ${response.status} - ${errorText}`, { status: response.status });
        }

        return new Response(response.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });
    } catch (err) {
        console.error("Fetch Exception:", err);
        return new Response('Internal Server Error', { status: 500 });
    }
};

export const config = {
    path: "/api/chat"
};
