import { getStore } from "@netlify/blobs";

const encoder = new TextEncoder();
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const betaClaimsStore = getStore('beta-access');

function readEnv(name) {
    if (typeof process !== 'undefined' && process.env?.[name]) {
        return process.env[name];
    }
    if (typeof Netlify !== 'undefined') {
        return Netlify.env.get(name);
    }
    return '';
}

function isBetaEnabled() {
    const value = String(readEnv('BETA_MODE') || '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function getAllowedCodes() {
    return String(readEnv('BETA_CODES') || '')
        .split(',')
        .map((code) => code.trim())
        .filter(Boolean);
}

function normalizeCode(code) {
    return String(code || '').trim().toUpperCase();
}

async function importSigningKey(secret) {
    return crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
}

function toBase64Url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replace(/=+$/g, '');
}

function fromBase64Url(input) {
    const base64 = input.replaceAll('-', '+').replaceAll('_', '/');
    const padding = '='.repeat((4 - (base64.length % 4 || 4)) % 4);
    return Buffer.from(base64 + padding, 'base64');
}

async function signPayload(payload, secret) {
    const key = await importSigningKey(secret);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return toBase64Url(Buffer.from(signature));
}

async function createToken(secret) {
    const payload = JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS });
    const encodedPayload = toBase64Url(payload);
    const signature = await signPayload(encodedPayload, secret);
    return `${encodedPayload}.${signature}`;
}

async function verifyToken(token, secret) {
    if (!token || !secret) return false;
    const [encodedPayload, signature] = String(token).split('.');
    if (!encodedPayload || !signature) return false;

    const expectedSignature = await signPayload(encodedPayload, secret);
    if (signature !== expectedSignature) return false;

    try {
        const payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8'));
        return Number(payload?.exp) > Date.now();
    } catch {
        return false;
    }
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        }
    });
}

export default async (req) => {
    const betaEnabled = isBetaEnabled();
    const signingSecret = String(readEnv('BETA_ACCESS_SECRET') || '').trim();

    if (req.method === 'GET') {
        if (!betaEnabled) {
            return json({ enabled: false, granted: true });
        }

        const token = req.headers.get('x-beta-token') || '';
        const granted = await verifyToken(token, signingSecret);
        return json({ enabled: true, granted });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    if (!betaEnabled) {
        return json({ enabled: false, granted: true });
    }

    if (!signingSecret) {
        return json({ error: 'BETA_ACCESS_SECRET is not configured.' }, 500);
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Invalid request body.' }, 400);
    }

    const submittedCode = normalizeCode(body?.code || '');
    const validCodes = getAllowedCodes().map(normalizeCode);

    if (!submittedCode || !validCodes.includes(submittedCode)) {
        return json({ error: 'Invalid beta code.' }, 401);
    }

    const claimKey = `codes/${submittedCode}`;
    const existingClaim = await betaClaimsStore.get(claimKey, { type: 'json' });

    if (existingClaim) {
        return json({ error: 'That beta code has already been used.' }, 409);
    }

    await betaClaimsStore.setJSON(claimKey, {
        code: submittedCode,
        usedAt: new Date().toISOString(),
        uid: String(body?.uid || '').trim(),
        email: String(body?.email || '').trim()
    });

    const token = await createToken(signingSecret);
    return json({ enabled: true, granted: true, token });
};

export const config = {
    path: '/api/beta-access'
};
