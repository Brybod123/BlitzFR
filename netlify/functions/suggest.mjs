const SUGGESTION_MODEL = "qwen/qwen3.6-plus:free";

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

    suggestion = suggestion.replace(/^\n{3,}/, '\n\n');

    // Inline ghost text is much more reliable when it starts with a visible token.
    if (/^\s*\n/.test(suggestion)) {
        suggestion = suggestion.trimStart();
    }

    return suggestion;
}

function getIndentation(beforeCursor = '') {
    const currentLine = beforeCursor.split('\n').pop() || '';
    const indentMatch = currentLine.match(/^\s*/);
    return indentMatch ? indentMatch[0] : '';
}

function buildFallbackSuggestion(language, beforeCursor = '', afterCursor = '') {
    const trimmed = beforeCursor.trimEnd();
    const indent = getIndentation(beforeCursor);
    const currentLine = beforeCursor.split('\n').pop() || '';
    const nextIndent = `${indent}    `;

    if (language === 'html') {
        const openTagMatch = trimmed.match(/<([a-zA-Z][\w-]*)[^>]*>$/);
        if (openTagMatch && !trimmed.endsWith('/>')) {
            const tag = openTagMatch[1];
            if (!afterCursor.includes(`</${tag}>`)) {
                return `\n${nextIndent}\n${indent}</${tag}>`;
            }
        }
        if (/<[a-zA-Z][\w-]*$/.test(currentLine)) {
            return '></' + currentLine.replace(/^.*<([a-zA-Z][\w-]*)$/, '$1') + '>';
        }
    }

    if (language === 'css') {
        if (/\{\s*$/.test(trimmed)) {
            return `\n${nextIndent}\n${indent}}`;
        }
        if (/:\s*$/.test(currentLine)) {
            return ';';
        }
    }

    if (language === 'javascript') {
        if (/\{\s*$/.test(trimmed)) {
            return `\n${nextIndent}\n${indent}}`;
        }
        if (/\(\s*$/.test(trimmed)) {
            return ')';
        }
        if (/=\s*$/.test(currentLine)) {
            return ' ';
        }
        if (/\b(return|await|const|let)\s+$/.test(currentLine)) {
            return '';
        }
    }

    return '';
}

function extractTextParts(value) {
    if (!value) return [];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) {
        return value.flatMap((item) => {
            if (!item) return [];
            if (typeof item === 'string') return [item];
            if (typeof item.text === 'string') return [item.text];
            if (typeof item.content === 'string') return [item.content];
            return [];
        });
    }
    if (typeof value.text === 'string') return [value.text];
    if (typeof value.content === 'string') return [value.content];
    return [];
}

function extractSuggestionText(data) {
    const choice = data?.choices?.[0] || {};
    const message = choice?.message || {};

    const parts = [
        ...extractTextParts(message.content),
        ...extractTextParts(choice.text),
        ...extractTextParts(data?.output_text),
        ...extractTextParts(data?.response?.output_text)
    ].map((part) => String(part || '').trim()).filter(Boolean);

    return parts.join('\n').trim();
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
        'Be highly pragmatic and code-first.',
        'Prefer syntactically valid continuations over ambitious ones.',
        'Prefer small, helpful continuations the user can accept in one action.',
        'Match the surrounding style, formatting, and indentation.',
        'Strongly prefer returning a useful continuation instead of an empty response.',
        'If the cursor is inside an unfinished tag, selector, block, function, object, array, or statement, complete that structure.',
        'If you are unsure, return a minimal continuation such as the next line, closing syntax, or the next obvious attribute/property.',
        'For HTML, prefer valid nested tags, attributes, and closing tags.',
        'For CSS, prefer valid properties, values, braces, and semicolons.',
        'For JavaScript, prefer valid expressions, arguments, braces, and statement endings.',
        'Never return placeholders like TODO, comment explanations, or prose.',
        'Return an empty response only when there is truly no sensible continuation.'
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
        'Return only the next code continuation for the cursor.',
        'Keep it brief and directly insertable.'
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
        const rawSuggestion = extractSuggestionText(data);
        const suggestion = cleanupSuggestion(rawSuggestion, beforeCursor) || buildFallbackSuggestion(language, beforeCursor, afterCursor);
        return json({ suggestion });
    } catch (error) {
        console.error('Suggestion fetch failed:', error);
        return json({ error: 'Internal Server Error' }, 500);
    }
};

export const config = {
    path: "/api/suggest"
};
