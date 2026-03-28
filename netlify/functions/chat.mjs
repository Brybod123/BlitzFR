export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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
                model: "qwen/qwen3.5-flash-02-23",
                messages: body.messages || [],
                stream: true
            })
        });

        if (!response.ok) {
            console.error("OpenRouter API Error:", await response.text());
            return new Response('Upstream API error', { status: response.status });
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
