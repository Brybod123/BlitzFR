import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const STORAGE_KEY = 'blitz.betaAccessToken';
const endpoint = '/api/beta-access';
const ALWAYS_ALLOWED_UIDS = new Set(['FgImriTL2lhkE8E1Xd257cSzkYh1an']);

const firebaseApp = initializeApp(firebaseConfig, 'beta-access');
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const style = document.createElement('style');
style.textContent = `
        html.beta-gate-pending body {
            visibility: hidden;
        }

        .beta-gate {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 32px 20px;
            background:
                radial-gradient(circle at top, rgba(34, 211, 238, 0.2), transparent 40%),
                linear-gradient(180deg, #05070b 0%, #0b1017 100%);
            color: #e5edf7;
            font-family: Inter, system-ui, sans-serif;
        }

        .beta-gate-card {
            width: min(100%, 420px);
            border: 2px solid #1ed8ff;
            border-radius: 0;
            padding: 30px;
            background:
                linear-gradient(180deg, rgba(4, 10, 20, 0.98), rgba(9, 15, 28, 0.96)),
                repeating-linear-gradient(
                    0deg,
                    rgba(255, 255, 255, 0.02),
                    rgba(255, 255, 255, 0.02) 1px,
                    transparent 1px,
                    transparent 3px
                );
            box-shadow: 0 0 0 2px rgba(0, 136, 255, 0.22), 0 24px 80px rgba(0, 0, 0, 0.45);
            clip-path: polygon(
                0 10px,
                10px 10px,
                10px 0,
                calc(100% - 10px) 0,
                calc(100% - 10px) 10px,
                100% 10px,
                100% calc(100% - 10px),
                calc(100% - 10px) calc(100% - 10px),
                calc(100% - 10px) 100%,
                10px 100%,
                10px calc(100% - 10px),
                0 calc(100% - 10px)
            );
        }

        .beta-gate-eyebrow {
            display: inline-flex;
            align-items: center;
            padding: 6px 10px;
            border: 1px solid rgba(30, 216, 255, 0.4);
            border-radius: 0;
            background: rgba(0, 136, 255, 0.12);
            color: #7cecff;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-family: "VT323", monospace;
        }

        .beta-gate h1 {
            margin: 16px 0 8px;
            font-family: "Jersey 10", sans-serif;
            font-size: clamp(3rem, 8vw, 4.5rem);
            line-height: 0.92;
            letter-spacing: 0.04em;
            color: #f8fbff;
        }

        .beta-gate p {
            margin: 0 0 18px;
            color: #a7b4c7;
            font-size: 18px;
            line-height: 1.6;
            font-family: "VT323", monospace;
        }

        .beta-gate form {
            display: grid;
            gap: 12px;
        }

        .beta-gate-actions {
            display: grid;
            gap: 10px;
            margin-bottom: 12px;
        }

        .beta-gate input {
            width: 100%;
            border: 2px solid #2d8cff;
            border-radius: 0;
            padding: 14px 16px;
            background: #09111c;
            color: #f8fbff;
            font: inherit;
            outline: none;
            font-family: "VT323", monospace;
            font-size: 24px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            clip-path: polygon(
                0 6px,
                6px 6px,
                6px 0,
                calc(100% - 6px) 0,
                calc(100% - 6px) 6px,
                100% 6px,
                100% calc(100% - 6px),
                calc(100% - 6px) calc(100% - 6px),
                calc(100% - 6px) 100%,
                6px 100%,
                6px calc(100% - 6px),
                0 calc(100% - 6px)
            );
        }

        .beta-gate input:focus {
            border-color: #67e8f9;
            box-shadow: 0 0 0 3px rgba(103, 232, 249, 0.14), 0 0 18px rgba(30, 216, 255, 0.18);
        }

        .beta-gate button {
            border: 0;
            border-radius: 0;
            padding: 14px 16px;
            background: linear-gradient(180deg, #37dfff, #128dff);
            color: #03101f;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
            font-family: "VT323", monospace;
            font-size: 22px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.24);
            clip-path: polygon(
                0 6px,
                6px 6px,
                6px 0,
                calc(100% - 6px) 0,
                calc(100% - 6px) 6px,
                100% 6px,
                100% calc(100% - 6px),
                calc(100% - 6px) calc(100% - 6px),
                calc(100% - 6px) 100%,
                6px 100%,
                6px calc(100% - 6px),
                0 calc(100% - 6px)
            );
        }

        .beta-gate button.beta-gate-google-btn {
            border: 2px solid #2d8cff;
            background: linear-gradient(180deg, #121c2b, #0b121d);
            color: #dff7ff;
        }

        .beta-gate button:disabled {
            opacity: 0.7;
            cursor: wait;
        }

        .beta-gate-user {
            margin: 0 0 14px;
            font-size: 18px;
            color: #67e8f9;
            font-family: "VT323", monospace;
        }

        .beta-gate-status {
            min-height: 20px;
            font-size: 18px;
            color: #fda4af;
            font-family: "VT323", monospace;
        }
    `;
document.head.appendChild(style);
document.documentElement.classList.add('beta-gate-pending');

function getSavedToken() {
    try {
        return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
        return '';
    }
}

function saveToken(token) {
    try {
        localStorage.setItem(STORAGE_KEY, token);
    } catch {
        // Ignore storage failures and rely on the current session.
    }
}

function clearToken() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Ignore storage failures.
    }
}

function getCurrentUser() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        }, () => resolve(null));
    });
}

function isAlwaysAllowedUser(user) {
    return Boolean(user?.uid && ALWAYS_ALLOWED_UIDS.has(user.uid));
}

async function requestState(token) {
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: token ? { 'x-beta-token': token } : {}
    });
    if (!response.ok) {
        throw new Error('Unable to check beta access.');
    }
    return response.json();
}

function unlockPage() {
    const gate = document.getElementById('beta-gate');
    if (gate) gate.remove();
    document.documentElement.classList.remove('beta-gate-pending');
}

async function handleGoogleSignIn(statusEl, userEl, button) {
    button.disabled = true;
    statusEl.textContent = '';
    try {
        const result = await signInWithPopup(auth, googleProvider);
        if (isAlwaysAllowedUser(result.user)) {
            unlockPage();
            return;
        }

        userEl.textContent = result.user?.email
            ? `Signed in as ${result.user.email}`
            : 'Signed in. Enter your beta code below.';
        statusEl.textContent = 'This account still needs a beta code.';
    } catch (error) {
        statusEl.textContent = error?.message || 'Unable to sign in right now.';
    } finally {
        button.disabled = false;
    }
}

function mountGate(currentUser) {
    const signedInLine = currentUser?.email
        ? `<div class="beta-gate-user" id="beta-gate-user">Signed in as ${currentUser.email}</div>`
        : `<div class="beta-gate-user" id="beta-gate-user">Sign in or enter your invite code to continue.</div>`;

    document.body.innerHTML = `
            <main class="beta-gate" id="beta-gate">
                <section class="beta-gate-card">
                    <span class="beta-gate-eyebrow">Private Beta</span>
                    <h1>BLITZ</h1>
                    <p>This build is currently invite-only. Enter your beta code to continue.</p>
                    ${signedInLine}
                    <div class="beta-gate-actions">
                        <button class="beta-gate-google-btn" id="beta-google-sign-in" type="button">Continue with Google</button>
                    </div>
                    <form id="beta-gate-form">
                        <input id="beta-code-input" name="code" type="text" autocomplete="one-time-code" placeholder="Enter beta code" required>
                        <button type="submit">Enter Blitz</button>
                        <div class="beta-gate-status" id="beta-gate-status" aria-live="polite"></div>
                    </form>
                </section>
            </main>
        `;
    document.documentElement.classList.remove('beta-gate-pending');

    const form = document.getElementById('beta-gate-form');
    const input = document.getElementById('beta-code-input');
    const status = document.getElementById('beta-gate-status');
    const submitButton = form.querySelector('button[type="submit"]');
    const googleButton = document.getElementById('beta-google-sign-in');
    const userEl = document.getElementById('beta-gate-user');

    googleButton.addEventListener('click', () => handleGoogleSignIn(status, userEl, googleButton));

    input.focus();
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        status.textContent = '';
        submitButton.disabled = true;

        try {
            const currentUserAfterSignIn = auth.currentUser;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: input.value,
                    uid: currentUserAfterSignIn?.uid || '',
                    email: currentUserAfterSignIn?.email || ''
                })
            });
            const data = await response.json();
            if (!response.ok || !data?.token) {
                throw new Error(data?.error || 'Invalid beta code.');
            }

            saveToken(data.token);
            window.location.reload();
        } catch (error) {
            status.textContent = error.message || 'Unable to verify beta code.';
            submitButton.disabled = false;
            input.select();
        }
    });
}

async function boot() {
    try {
        const user = await getCurrentUser();
        if (isAlwaysAllowedUser(user)) {
            unlockPage();
            return;
        }

        const token = getSavedToken();
        const state = await requestState(token);

        if (!state.enabled) {
            clearToken();
            unlockPage();
            return;
        }

        if (state.granted) {
            unlockPage();
            return;
        }

        clearToken();
        if (document.body) {
            mountGate(user);
        } else {
            document.addEventListener('DOMContentLoaded', () => mountGate(user), { once: true });
        }
    } catch (error) {
        console.error(error);
        const user = auth.currentUser;
        if (document.body) {
            mountGate(user);
        } else {
            document.addEventListener('DOMContentLoaded', () => mountGate(user), { once: true });
        }
    }
}

boot();
