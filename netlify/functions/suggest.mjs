const SUGGESTION_MODEL = "liquid/lfm-2.5-1.2b-thinking:free";

function readEnv(name) {
    if (typeof process !== 'undefined' && process.env?.[name]) {
        return process.env[name];
    }
    if (typeof Netlify !== 'undefined') {
        return Netlify.env.get(name);
    }
    return '';
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        }
    });
}

function cleanupSuggestion(text, beforeCursor = '') {
    let suggestion = String(text || '')
        .replace(/^```[a-zA-Z0-9_-]*\n?/, '')
        .replace(/```$/g, '')
        .replace(/\r/g, '');

    const currentLinePrefix = beforeCursor.split('\n').pop() || '';
    if (currentLinePrefix && suggestion.startsWith(currentLinePrefix)) {
        suggestion = suggestion.slice(currentLinePrefix.length);
    }

    return suggestion.replace(/^\n{3,}/, '\n\n');
}

export default async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const OPENROUTER_API_KEY = readEnv('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
        return json({ error: 'OPENROUTER_API_KEY is not configured.' }, 401);
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Bad Request' }, 400);
    }

    const language = String(body?.language || 'plaintext');
    const fileName = String(body?.fileName || 'file');
    const beforeCursor = String(body?.beforeCursor || '');
    const afterCursor = String(body?.afterCursor || '');

    if (!beforeCursor.trim()) {
        return json({ suggestion: '' });
    }

    const systemPrompt = [
        'You are Blitz Smart Suggestions, an inline code completion model.',
        'Your job is to suggest the next short code continuation for the user at the cursor.',
        'Return only the text to insert at the cursor.',
        'Do not explain anything.',
        'Do not use markdown fences.',
        'Do not repeat code that already appears before the cursor unless indentation requires it.',
        'Prefer small, helpful continuations the user can accept in one action.',
        'Match the surrounding style, formatting, and indentation.',
        'If the best suggestion is nothing, return an empty response.'
    ].join(' ');

    const userPrompt = [
        `File: ${fileName}`,
        `Language: ${language}`,
        '',
        'Code before cursor:',
        beforeCursor.slice(-4000),
        '',
        'Code after cursor:',
        afterCursor.slice(0, 1200),
        '',
        'Return only the next code continuation for the cursor.'
    ].join('\n');

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://github.com/Brybod123/BlitzFR",
                "X-Title": "Blitz Smart Suggestions",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: SUGGESTION_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: false,
                max_tokens: 160,
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('Suggestion API error:', response.status, errorText);
            return json({ error: 'Suggestion request failed.' }, response.status);
        }

        const data = await response.json();
        const rawSuggestion = data?.choices?.[0]?.message?.content || '';
        const suggestion = cleanupSuggestion(rawSuggestion, beforeCursor);
        return json({ suggestion });
    } catch (error) {
        console.error('Suggestion fetch failed:', error);
        return json({ error: 'Internal Server Error' }, 500);
    }
};

export const config = {
    path: "/api/suggest"
};
