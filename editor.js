const toggleBtns = document.querySelectorAll('.main-toggles .toggle-btn');
const aiEditor = document.getElementById('ai-editor');
const previewFrame = document.getElementById('preview-frame');
const promptArea = document.getElementById('prompt-area');
const generateBtn = document.querySelector('.btn-generate');
const codeView = document.getElementById('code-view');
const codeTabs = document.getElementById('code-tabs');
const btnFileExplorer = document.getElementById('btn-file-explorer');
const fileExplorer = document.getElementById('file-explorer');
const fileList = document.getElementById('file-list');
const btnNewFile = document.getElementById('btn-new-file');
const editorContainer = document.querySelector('.editor-container');
const editorSide = document.querySelector('.editor-side');
const previewSide = document.querySelector('.preview-side');
const btnToggleEditorPane = document.getElementById('btn-toggle-editor-pane');
const btnRestoreEditorPane = document.getElementById('btn-restore-editor-pane');
const saveBtn = document.querySelector('.save-btn');
const mobileEditorNavBtns = document.querySelectorAll('.mobile-editor-nav-btn');
const hostedPublishApiBase = 'https://terminal.bookitreal.workers.dev';
const loadingAssetPath = 'loading.svg';
const smartSuggestionModelId = 'liquid/lfm-2.5-1.2b-thinking:free';
let editorPaneTransitionTimer = null;
let mobileEditorMode = 'code';
const saveButtonDefaultHtml = saveBtn ? saveBtn.innerHTML : 'PUBLISH';
const suggestionCache = new Map();

let chatMessages = [
    {
        role: 'system',
        content: `You are an advanced AI coding assistant in the Blitz IDE. 
You can manipulate files using special tags. Use them only when necessary.

TOOLS:
1. To read a file: <read_file path="filename"/>
2. To create/overwrite a file: <write_file path="filename">content</write_file>
3. To edit a file via search/replace: <edit_file path="filename"><search>exact_text_to_find</search><replace>new_text</replace></edit_file>
4. To delete a file: <delete_file path="filename"/>

When editing, the <search> block must exactly match the text in the file.
You can use multiple tags in one response. Always explain what you are doing.`
    }
];

const initialHtml = `<div class="main-container">
    <h1 class="heading">My First Blitz Website</h1>
    <p class="description">This site was built using HTML, CSS, and JS. Try editing the code on the right!</p>
    <button id="interaction-btn" class="btn">Click Me!</button>
</div>`;

const initialCss = `.main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: rgba(0, 136, 255, 0.1);
    border-radius: 15px;
    font-family: sans-serif;
    gap: 20px;
}

.heading {
    color: #00ffff;
    margin: 0;
}

.description {
    color: #ffffff;
    margin: 0;
}

.btn {
    background: #0088ff;
    color: #000000;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    font-weight: bold;
}

.btn:hover {
    background: #00aaff;
}`;

const initialJs = `const btn = document.getElementById('interaction-btn');
btn.addEventListener('click', () => {
    console.log("Button clicked!");
    btn.textContent = "You clicked it!";
    btn.style.background = "#00ff00";
});`;

// Intercept window.open explicitly for Monaco's link clicker
const originalWindowOpen = window.open;
window.open = function(url, ...args) {
    if (typeof url === 'string') {
        const cleanUrl = url.replace(/^[a-zA-Z]+:\/\//, '').replace(/^\.\//, '').replace(/^\//, '');
        const possibleFileName = cleanUrl.split('/').pop();
        if (files[possibleFileName]) {
            console.log("VFS Navigate via Editor Link:", possibleFileName);
            openFile(possibleFileName);
            return { focus: () => {} }; // Mock window object to avoid errors
        }
    }
    return originalWindowOpen.call(window, url, ...args);
};

// Setup Monaco Models (Virtual File System)
let files = {
    'index.html': { model: monaco.editor.createModel(initialHtml, "html", monaco.Uri.file("index.html")), lang: 'html' },
    'styles.css': { model: monaco.editor.createModel(initialCss, "css", monaco.Uri.file("styles.css")), lang: 'css' },
    'script.js': { model: monaco.editor.createModel(initialJs, "javascript", monaco.Uri.file("script.js")), lang: 'javascript' }
};

let activeFile = 'index.html';
let currentUser = window.firebaseUser || null;
let currentProjectOwnerUid = null;
let currentProjectId = null;
let forkSourceProject = null;
let currentHostedWebsite = null;
let currentHostedSlug = null;
const mobileEditorQuery = window.matchMedia('(max-width: 760px)');

// Create editor
const editor = monaco.editor.create(document.getElementById('monaco-container'), {
    model: files[activeFile].model,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    inlineSuggest: {
        enabled: true,
        mode: 'subword',
        showToolbar: 'onHover'
    }
});

// Setup Diff Editor
const diffEditor = monaco.editor.createDiffEditor(document.getElementById('diff-editor-inner'), {
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    readOnly: true
});

const diffContainer = document.getElementById('monaco-diff-container');
document.getElementById('btn-close-diff').addEventListener('click', () => {
    diffContainer.classList.add('hidden');
});

function applyEditorTheme(theme) {
    const monacoTheme = theme === 'light' ? 'vs' : 'vs-dark';
    monaco.editor.setTheme(monacoTheme);
}

function setEditorPaneCollapsed(collapsed) {
    document.body.classList.add('pane-transitioning');
    editorContainer.classList.toggle('editor-collapsed', collapsed);
    previewSide.classList.toggle('preview-focused', collapsed);
    btnRestoreEditorPane.classList.toggle('is-visible', collapsed);
    btnToggleEditorPane.classList.toggle('active', collapsed);
    btnToggleEditorPane.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
    btnToggleEditorPane.setAttribute('title', collapsed ? 'Show Editor' : 'Collapse Editor');
    const label = btnToggleEditorPane.querySelector('.panel-toggle-label');
    if (label) label.textContent = collapsed ? 'Edit Again' : 'Focus Preview';
    window.clearTimeout(editorPaneTransitionTimer);
    editorPaneTransitionTimer = window.setTimeout(() => {
        document.body.classList.remove('pane-transitioning');
        editor.layout();
    }, 420);
}

function syncMobileEditorLayout() {
    if (!mobileEditorQuery.matches) {
        document.body.classList.remove('mobile-editor-mode-code', 'mobile-editor-mode-preview', 'mobile-editor-mode-ai');
        btnRestoreEditorPane.classList.remove('is-visible');
        return;
    }

    if (!fileExplorer.classList.contains('hidden')) {
        fileExplorer.classList.add('hidden');
        btnFileExplorer.classList.remove('active');
    }

    setMobileEditorMode(mobileEditorMode);
}

function setMobileEditorMode(mode) {
    if (!mobileEditorQuery.matches) return;

    mobileEditorMode = ['code', 'preview', 'ai'].includes(mode) ? mode : 'code';
    document.body.classList.remove('mobile-editor-mode-code', 'mobile-editor-mode-preview', 'mobile-editor-mode-ai');
    document.body.classList.add(`mobile-editor-mode-${mobileEditorMode}`);

    if (!fileExplorer.classList.contains('hidden')) {
        fileExplorer.classList.add('hidden');
        btnFileExplorer.classList.remove('active');
    }

    mobileEditorNavBtns.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.mobilePanel === mobileEditorMode);
    });

    btnRestoreEditorPane.classList.toggle('is-visible', mobileEditorMode === 'preview');
    previewSide.classList.toggle('preview-focused', mobileEditorMode === 'preview');

    if (mobileEditorMode === 'ai') {
        codeView.classList.add('hidden');
        aiEditor.classList.remove('hidden');
        aiEditor.classList.add('active');
    } else {
        aiEditor.classList.remove('active');
        aiEditor.classList.add('hidden');
        codeView.classList.remove('hidden');
        window.setTimeout(() => editor.layout(), 0);
    }
}

window.blitzApplyTheme = (theme) => {
    document.body.dataset.theme = theme === 'light' ? 'light' : 'dark';
    applyEditorTheme(document.body.dataset.theme);
};

window.blitzApplyTheme(localStorage.getItem('blitz_theme') || 'dark');

function renderMarkdownSafe(text) {
    const rawHtml = marked.parse(text || "");
    if (window.DOMPurify) {
        return window.DOMPurify.sanitize(rawHtml);
    }
    const fallback = document.createElement('div');
    fallback.textContent = text || "";
    return fallback.innerHTML;
}

function waitForAuth() {
    if (window.firebaseAuthReady && window.firebaseUser) {
        currentUser = window.firebaseUser;
        return Promise.resolve(currentUser);
    }

    if (!window.firebaseUser && typeof window.firebaseSignIn === 'function') {
        return window.firebaseSignIn().then(() => waitForAuth());
    }

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error("Authentication timed out."));
        }, 8000);

        function handleReady() {
            currentUser = window.firebaseUser || null;
            if (!currentUser) return;
            cleanup();
            resolve(currentUser);
        }

        function cleanup() {
            clearTimeout(timer);
            window.removeEventListener('firebase-auth-ready', handleReady);
        }

        window.addEventListener('firebase-auth-ready', handleReady);
    });
}

function updateSaveButtonState() {
    if (!saveBtn) return;

    if (!currentUser) {
        saveBtn.disabled = false;
        saveBtn.classList.remove('loading');
        saveBtn.textContent = 'SIGN IN';
        saveBtn.style.opacity = '1';
        saveBtn.style.cursor = 'pointer';
        return;
    }

    if (currentProjectId && currentProjectOwnerUid && currentProjectOwnerUid !== currentUser.uid) {
        saveBtn.disabled = true;
        saveBtn.classList.remove('loading');
        saveBtn.textContent = 'READ ONLY';
        saveBtn.style.opacity = '0.45';
        saveBtn.style.cursor = 'not-allowed';
        return;
    }

    saveBtn.disabled = false;
    saveBtn.classList.remove('loading');
    saveBtn.textContent = 'PUBLISH';
    saveBtn.style.opacity = '1';
    saveBtn.style.cursor = 'pointer';
}

function createLoadingImage(label = 'Loading') {
    const img = document.createElement('img');
    img.src = loadingAssetPath;
    img.alt = label;
    img.className = 'loading-mark';
    return img;
}

function setGenerateButtonLoading(isLoading) {
    generateBtn.disabled = isLoading;
    if (isLoading) {
        generateBtn.innerHTML = `<img src="${loadingAssetPath}" alt="Generating" class="loading-mark">`;
        generateBtn.setAttribute('aria-label', 'Generating');
    } else {
        generateBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        `;
        generateBtn.setAttribute('aria-label', 'Send prompt');
    }
}

function setSaveButtonLoading(isLoading, label = 'Publishing') {
    if (!saveBtn) return;
    if (isLoading) {
        saveBtn.disabled = true;
        saveBtn.classList.add('loading');
        saveBtn.innerHTML = `<img src="${loadingAssetPath}" alt="${label}" class="loading-mark"><span>${label}</span>`;
        saveBtn.style.opacity = '1';
        saveBtn.style.cursor = 'wait';
        return;
    }

    saveBtn.classList.remove('loading');
    saveBtn.innerHTML = saveButtonDefaultHtml;
    saveBtn.disabled = false;
    updateSaveButtonState();
}

function getSuggestionContext(model, position) {
    const fullText = model.getValue();
    const offset = model.getOffsetAt(position);
    return {
        beforeCursor: fullText.slice(0, offset),
        afterCursor: fullText.slice(offset)
    };
}

function getSuggestionCacheKey(model, position) {
    const { beforeCursor, afterCursor } = getSuggestionContext(model, position);
    return JSON.stringify({
        fileName: activeFile,
        language: files[activeFile]?.lang || model.getLanguageId(),
        beforeCursor: beforeCursor.slice(-600),
        afterCursor: afterCursor.slice(0, 200)
    });
}

async function fetchSmartSuggestion(model, position) {
    const fileName = activeFile;
    const language = files[fileName]?.lang || model.getLanguageId();
    const { beforeCursor, afterCursor } = getSuggestionContext(model, position);
    const cacheKey = getSuggestionCacheKey(model, position);
    const cached = suggestionCache.get(cacheKey);

    if (cached && (Date.now() - cached.ts) < 15000) {
        return cached.text;
    }

    const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fileName,
            language,
            beforeCursor,
            afterCursor,
            model: smartSuggestionModelId
        })
    });

    if (!response.ok) {
        throw new Error('Suggestion request failed');
    }

    const data = await response.json();
    const text = String(data?.suggestion || '');
    suggestionCache.set(cacheKey, { text, ts: Date.now() });
    return text;
}

const inlineLanguages = ['html', 'css', 'javascript'];
inlineLanguages.forEach((languageId) => {
    monaco.languages.registerInlineCompletionsProvider(languageId, {
        provideInlineCompletions: async (model, position, context, token) => {
            if (token.isCancellationRequested) return { items: [] };
            if (mobileEditorQuery.matches && mobileEditorMode !== 'code') return { items: [] };
            if (codeView.classList.contains('hidden')) return { items: [] };
            if (model !== editor.getModel()) return { items: [] };

            const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
            if (!linePrefix.trim()) return { items: [] };

            try {
                const suggestion = await fetchSmartSuggestion(model, position);
                if (token.isCancellationRequested || !suggestion.trim()) {
                    return { items: [] };
                }

                return {
                    items: [{
                        insertText: suggestion,
                        range: new monaco.Range(
                            position.lineNumber,
                            position.column,
                            position.lineNumber,
                            position.column
                        )
                    }]
                };
            } catch (error) {
                return { items: [] };
            }
        },
        freeInlineCompletions() {
            // Monaco handles cleanup for plain text suggestions here.
        }
    });
});

window.addEventListener('firebase-auth-ready', () => {
    currentUser = window.firebaseUser || null;
    updateSaveButtonState();
});

updateSaveButtonState();

function showDiff(filename, oldContent, newContent) {
    const originalModel = monaco.editor.createModel(oldContent, files[filename].lang);
    const modifiedModel = monaco.editor.createModel(newContent, files[filename].lang);
    diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
    });
diffContainer.classList.remove('hidden');
    // Switch to file first
    openFile(filename);
}

let currentPreviewPage = 'index.html';
let activeBlobUrls = {}; // Track blob URLs to prevent memory leaks

function buildRenderableHtml(pageToLoad = currentPreviewPage) {
    if (!files[pageToLoad]) pageToLoad = Object.keys(files).find(f => f.endsWith('.html')) || 'index.html';

    const assetUrls = {};
    for (const [filename, fileObj] of Object.entries(files)) {
        if (filename.endsWith('.html')) continue;
        let type = 'text/plain';
        if (filename.endsWith('.css')) type = 'text/css';
        else if (filename.endsWith('.js')) type = 'application/javascript';
        const blob = new Blob([fileObj.model.getValue()], { type });
        assetUrls[filename] = URL.createObjectURL(blob);
    }

    let htmlContent = files[pageToLoad] ? files[pageToLoad].model.getValue() : "<h1>No valid HTML page found</h1>";

    for (const [filename, url] of Object.entries(assetUrls)) {
        const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexHref = new RegExp(`href=["']\\.?/?${escapedFilename}["']`, 'g');
        const regexSrc = new RegExp(`src=["']\\.?/?${escapedFilename}["']`, 'g');
        htmlContent = htmlContent.replace(regexHref, `href="${url}"`);
        htmlContent = htmlContent.replace(regexSrc, `src="${url}"`);
    }

    return { pageToLoad, htmlContent, assetUrls };
}

function buildPublishFilesPayload() {
    const payload = {};
    for (const [filename, fileObj] of Object.entries(files)) {
        payload[filename] = fileObj.model.getValue();
    }
    return payload;
}

function slugifyProjectName(projectName) {
    const base = String(projectName || 'blitz-project')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'blitz-project';
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
}

function getHostedProjectUrl(slug) {
    return `${hostedPublishApiBase.replace(/\/$/, '')}/site/${slug}`;
}

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'navigate') {
        let target = e.data.url;
        target = target.replace(/^\.\//, '').replace(/^\//, ''); // Clean leading slashes
        if (files[target]) {
            console.log(`VFS Navigation: Route to ${target}`);
            updatePreview(target);
        } else {
            console.warn(`VFS Navigation: Route ${target} not found in virtual system.`);
        }
    }
});

// Build Live Preview with multi-page and asset support
function updatePreview(pageToLoad = currentPreviewPage) {
    try {
        const rendered = buildRenderableHtml(pageToLoad);
        currentPreviewPage = rendered.pageToLoad;

        // Clean up old object URLs
        Object.values(activeBlobUrls).forEach(URL.revokeObjectURL);
        activeBlobUrls = rendered.assetUrls;

        let htmlContent = rendered.htmlContent;

        // Inject navigation interceptor script
        const interceptScript = `
<script>
    document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (a && a.getAttribute('href')) {
            const href = a.getAttribute('href');
            // Allow external links or anchors
            if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
                e.preventDefault();
                window.parent.postMessage({ type: 'navigate', url: href }, '*');
            }
        }
    });
<\/script>`;

        if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace('</body>', interceptScript + '\n</body>');
        } else {
            htmlContent += interceptScript;
        }

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        previewFrame.src = url;

        if (previewFrame.dataset.lastUrl) URL.revokeObjectURL(previewFrame.dataset.lastUrl);
        previewFrame.dataset.lastUrl = url;
    } catch (e) {
        console.error("Preview Update Error:", e);
    }
}


// Bind active listeners
function bindContentChange(model) {
    model.onDidChangeContent(() => {
        updatePreview();
    });
}

Object.values(files).forEach(f => bindContentChange(f.model));
updatePreview();

// UI Render Logic
function renderFiles() {
    fileList.innerHTML = '';
    codeTabs.innerHTML = '';

    Object.keys(files).forEach(filename => {
        // File Tree Item
        const li = document.createElement('li');
        li.className = `file-item ${filename === activeFile ? 'active' : ''}`;

        let icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
        if (filename.endsWith('.html')) {
            icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e34f26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
        } else if (filename.endsWith('.css')) {
            icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a90e2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;
        } else if (filename.endsWith('.js')) {
            icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f7df1e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2"></path><path d="M15 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2"></path></svg>`;
        } else if (filename.endsWith('.py')) {
            icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#357abd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
        }

        const iconWrap = document.createElement('span');
        iconWrap.innerHTML = icon;
        const nameWrap = document.createElement('span');
        nameWrap.textContent = filename;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'file-item-delete';
        deleteBtn.title = 'Delete';
        deleteBtn.textContent = '✕';
        li.append(iconWrap, nameWrap, deleteBtn);

        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('file-item-delete')) return;
            openFile(filename);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFile(filename);
        });

        fileList.appendChild(li);

        // Code Tab Item
        const tab = document.createElement('button');
        tab.className = `code-tab ${filename === activeFile ? 'active' : ''}`;
        tab.textContent = filename;
        tab.addEventListener('click', () => openFile(filename));
        codeTabs.appendChild(tab);
    });
}

function openFile(filename) {
    if (!files[filename]) return;
    activeFile = filename;
    editor.setModel(files[filename].model);
    renderFiles();
}

function deleteFile(filename) {
    if (Object.keys(files).length <= 1) {
        alert("You must leave at least one file open.");
        return;
    }

    files[filename].model.dispose();
    delete files[filename];

    if (activeFile === filename) {
        activeFile = Object.keys(files)[0];
        editor.setModel(files[activeFile].model);
    }

    renderFiles();
    updatePreview();
}

btnNewFile.addEventListener('click', () => {
    let filename = prompt("Enter a file name (e.g., main.py, index.html):", "newfile.py");
    if (!filename) return;

    filename = filename.trim();
    if (files[filename]) {
        alert("File already exists!");
        return;
    }

    let ext = filename.split('.').pop().toLowerCase();
    let lang = 'plaintext';
    if (ext === 'html') lang = 'html';
    else if (ext === 'css') lang = 'css';
    else if (ext === 'js') lang = 'javascript';
    else if (ext === 'py') lang = 'python';

    files[filename] = {
        model: monaco.editor.createModel("", lang, monaco.Uri.file(filename)),
        lang: lang
    };

    bindContentChange(files[filename].model);
    openFile(filename);
    updatePreview();
});

renderFiles();

// File Explorer Toggle
btnFileExplorer.addEventListener('click', () => {
    fileExplorer.classList.toggle('hidden');
    btnFileExplorer.classList.toggle('active');
    setTimeout(() => editor.layout(), 0);
});

document.addEventListener('click', (event) => {
    if (!mobileEditorQuery.matches) return;
    if (fileExplorer.classList.contains('hidden')) return;
    if (fileExplorer.contains(event.target) || btnFileExplorer.contains(event.target)) return;
    fileExplorer.classList.add('hidden');
    btnFileExplorer.classList.remove('active');
});

btnToggleEditorPane.addEventListener('click', () => {
    if (mobileEditorQuery.matches) {
        setMobileEditorMode('preview');
        return;
    }
    const nextState = !editorContainer.classList.contains('editor-collapsed');
    setEditorPaneCollapsed(nextState);
});
btnRestoreEditorPane.addEventListener('click', () => {
    if (mobileEditorQuery.matches) {
        setMobileEditorMode('code');
        return;
    }
    setEditorPaneCollapsed(false);
});
mobileEditorNavBtns.forEach((btn) => {
    btn.addEventListener('click', () => setMobileEditorMode(btn.dataset.mobilePanel));
});
mobileEditorQuery.addEventListener('change', syncMobileEditorLayout);
window.addEventListener('resize', () => {
    if (!mobileEditorQuery.matches) {
        editor.layout();
    }
});
syncMobileEditorLayout();

// Helper for AI File Editing
function applyFileEdit(filename, search, replace) {
    if (!files[filename]) return `Error: File ${filename} not found.`;
    const model = files[filename].model;
    const content = model.getValue();

    if (!content.includes(search)) {
        return `Error: Search string not found in ${filename}.`;
    }

    const newContent = content.replace(search, replace);

    // Capture for diff
    showDiff(filename, content, newContent);

    model.setValue(newContent);
    updatePreview();
    return `Successfully updated ${filename}.`;
}

function aiCreateFile(filename, content) {
    let ext = filename.split('.').pop().toLowerCase();
    let lang = 'plaintext';
    if (ext === 'html') lang = 'html';
    else if (ext === 'css') lang = 'css';
    else if (ext === 'js') lang = 'javascript';
    else if (ext === 'py') lang = 'python';

    if (files[filename]) {
        files[filename].model.setValue(content);
    } else {
        files[filename] = {
            model: monaco.editor.createModel(content, lang, monaco.Uri.file(filename)),
            lang: lang
        };
        bindContentChange(files[filename].model);
    }
    openFile(filename);
    updatePreview();
    return `File ${filename} created/updated.`;
}

// Main UI Toggles (Code vs AI)
toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.dataset.mode;

        if (mode === 'ai') {
            codeView.classList.add('hidden');
            aiEditor.classList.remove('hidden');
            aiEditor.classList.add('active');
            if (mobileEditorQuery.matches) setMobileEditorMode('ai');
        } else {
            aiEditor.classList.remove('active');
            aiEditor.classList.add('hidden');
            codeView.classList.remove('hidden');
            if (mobileEditorQuery.matches) setMobileEditorMode('code');
            setTimeout(() => editor.layout(), 0);
        }
    });
});

// Handle Enter to send, Shift+Enter for newline
const chatHistory = document.getElementById('chat-history');
promptArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateBtn.click();
    }
});

// AI Generation Logic
generateBtn.addEventListener('click', async () => {
    if (generateBtn.disabled) return;
    
    const promptText = promptArea.value.trim();
    if (!promptText) return;

    if (globalCredits <= 50) {
        alert("Global credits depleted. Messages are disabled until the balance is restored.");
        return;
    }

    const remaining = getRemainingHourlyRequests(dropdownTrigger.dataset.value || "qwen/qwen3.5-flash-02-23");
    if (remaining <= 0) {
        alert("Hourly message limit reached for this specific model. Switch to a cheaper model or wait until the next hour.");
        return;
    }

    chatMessages.push({ role: 'user', content: promptText });
    await incrementHourlyRequests();

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user-message';
    const userAvatar = document.createElement('span');
    userAvatar.className = 'chat-avatar';
    userAvatar.textContent = 'U';
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble';
    userBubble.innerHTML = renderMarkdownSafe(promptText);
    userMsg.append(userAvatar, userBubble);
    chatHistory.appendChild(userMsg);
    promptArea.value = '';

    // Add AI loading message
    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-message ai-message';
    const aiAvatar = document.createElement('span');
    aiAvatar.className = 'chat-avatar';
    aiAvatar.textContent = 'AI';
    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble loading-bubble';
    aiBubble.append(createLoadingImage('Generating response'), document.createTextNode('Generating your request...'));
    aiMsg.append(aiAvatar, aiBubble);
    chatHistory.appendChild(aiMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    setGenerateButtonLoading(true);
    const bubble = aiBubble;

    await runChatLoop(bubble);
    setGenerateButtonLoading(false);
});

async function runChatLoop(bubble, turn = 1) {
    if (turn > 3) return;

    const fileContext = Object.keys(files).map(f => `- ${f}`).join('\n');
    const tempMessages = [
        ...chatMessages.slice(0, 1),
        { role: 'system', content: `Current files in project:\n${fileContext}\nProject context: This is a web project. index.html is the entry point.` },
        ...chatMessages.slice(1)
    ];

    const currentModelId = document.getElementById('model-dropdown-trigger').dataset.value || "qwen/qwen3.5-flash-02-23";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                messages: tempMessages,
                model: currentModelId
            })
        });

        if (!response.ok) {
            bubble.textContent = "Error communicating with AI.";
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let aiContent = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') break;
                    try {
                        const json = JSON.parse(dataStr);
                        if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                            aiContent += json.choices[0].delta.content;
                            updateAiMessageUI(bubble, aiContent);
                            chatHistory.scrollTop = chatHistory.scrollHeight;
                        }
                    } catch (e) { }
                }
            }
        }

        chatMessages.push({ role: 'assistant', content: aiContent });
        updateCredits();
        updateModelStats(); // Market refresh
        await recordUsageEvent(currentModelId);

        // Parse and Execute Tools
        const needsReply = executeAiTools(aiContent);

        if (needsReply) {
            await new Promise(r => setTimeout(r, 300));
            // Add a separator for the next turn
            const sep = document.createElement('div');
            sep.style.height = "1px";
            sep.style.background = "#2d3748";
            sep.style.margin = "10px 0";
            bubble.appendChild(sep);
            await runChatLoop(bubble, turn + 1);
        }
    } catch (err) {
        console.error(err);
        bubble.textContent = "Connection error.";
    }
}

async function recordUsageEvent(modelId) {
    if (!currentUser || !window.firebaseReady || !window.firebasePush || !window.firebaseSet || !window.firebaseRef || !window.firebaseDB) {
        return;
    }

    try {
        const pricePerToken = parseFloat(modelPrices[modelId]) || 0.000005;
        const cost = avgTokens * pricePerToken;
        const usageRef = window.firebaseRef(window.firebaseDB, `users/${currentUser.uid}/usageEvents`);
        const newRef = window.firebasePush(usageRef);
        await window.firebaseSet(newRef, {
            modelId,
            cost,
            tokens: avgTokens,
            createdAt: Date.now()
        });
    } catch (error) {
        console.error('Failed to record usage event', error);
    }
}

function updateAiMessageUI(bubble, content) {
    bubble.innerHTML = '';

    // Combined regex for XML-style and Kimi-style tools
    const regex = /(<(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check)[^>]*\/>|<(write_file|edit_file|create_file|search_codebase)[^>]*>[\s\S]*?<\/(write_file|edit_file|create_file|search_codebase)>|<\|tool_call_begin\|> functions\.(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check):\d+ <\|tool_call_argument_begin\|> ([\s\S]*?) <\|tool_call_end\|>)|(<(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check)[^>]*$|<(write_file|edit_file|create_file|search_codebase)[^>]*>[\s\S]*?$|<\|tool_call_begin\|> functions\.(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check):\d+ <\|tool_call_argument_begin\|> [\s\S]*?$)/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const textBefore = content.substring(lastIndex, match.index);
        if (textBefore) {
            const span = document.createElement('span');
            span.innerHTML = renderMarkdownSafe(textBefore);
            bubble.appendChild(span);
        }

        const fullMatch = match[0];
        const isComplete = !!match[1];

        let type, path, diffData = null;

        if (fullMatch.includes('<|tool_call_begin|>')) {
            // Kimi style
            const typeM = fullMatch.match(/functions\.(\w+):/);
            type = typeM ? typeM[1] : "tool";
            const argM = fullMatch.match(/<\|tool_call_argument_begin\|> ([\s\S]*?)( <\|tool_call_end\|>|$)/);
            if (argM) {
                try {
                    const args = JSON.parse(argM[1].trim());
                    path = args.path || args.task || "";
                    if (type === 'edit_file' && isComplete) {
                        diffData = { path, search: args.search, replace: args.replace };
                    }
                } catch (e) { path = "item"; }
            }
        } else {
            // XML style
            const typeMatch = fullMatch.match(/<(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check)/);
            type = typeMatch ? typeMatch[1] : "tool";
            const pathMatch = fullMatch.match(/path="([^"]+)"/);
            const taskMatch = fullMatch.match(/task="([^"]+)"/);
            path = pathMatch ? pathMatch[1] : (taskMatch ? taskMatch[1] : "");

            if (type === 'edit_file' && isComplete) {
                const sm = fullMatch.match(/<search>([\s\S]*?)<\/search>/);
                const rm = fullMatch.match(/<replace>([\s\S]*?)<\/replace>/);
                if (sm && rm) diffData = { path, search: sm[1], replace: rm[1] };
            }
        }

        const labelMap = {
            'read_file': 'Reading ',
            'write_file': 'Writing ',
            'create_file': 'Creating ',
            'edit_file': 'Modifying ',
            'delete_file': 'Deleting ',
            'read_codebase': 'Scanning Codebase...',
            'search_codebase': 'Searching Codebase...',
            'todo_add': 'Adding To-Do: ',
            'todo_read': 'Reading To-Do List',
            'todo_check': 'Checking To-Do: '
        };
        const doneMap = {
            'read_file': 'Read ',
            'write_file': 'Updated ',
            'create_file': 'Created ',
            'edit_file': 'Modified ',
            'delete_file': 'Deleted ',
            'read_codebase': 'Scan Complete',
            'search_codebase': 'Search Complete',
            'todo_add': 'Added To-Do: ',
            'todo_read': 'To-Do List Read',
            'todo_check': 'Checked To-Do: '
        };

        const label = isComplete ? (doneMap[type] + (path || "")) : (labelMap[type] + (path || ""));
        bubble.appendChild(createToolCard(label, isComplete, type, path, diffData));
        lastIndex = regex.lastIndex;
    }

    const remainingText = content.substring(lastIndex);
    if (remainingText) {
        const span = document.createElement('span');
        span.innerHTML = renderMarkdownSafe(remainingText);
        bubble.appendChild(span);
    }
}

let globalCredits = 100;

// Console Debug Tools
window.setBalance = (num) => {
    globalCredits = num;
    console.log(`DEBUG: balance set to $${num}. Updating UI...`);
    
    // Manually trigger UI update logic similar to updateCredits but with mock value
    const bar = document.getElementById('credits-bar');
    const text = document.getElementById('credits-text');
    const percentage = Math.max(0, Math.min(100, num));
    bar.style.width = percentage + '%';
    text.textContent = `$${num.toFixed(2)} (MOCK) credits remaining`;
    
    if (num <= 50) {
        bar.style.background = 'black';
        generateBtn.disabled = true;
        generateBtn.textContent = 'Credits Depleted';
    } else {
        bar.style.background = '#10b981';
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
    }
    calculateEstimatedCost(dropdownTrigger.dataset.value);
};

// Credits Logic
async function updateCredits() {
    try {
        const res = await fetch('/api/credits');
        const data = await res.json();
        const credits = data.credits;
        globalCredits = credits;
        const bar = document.getElementById('credits-bar');
        const text = document.getElementById('credits-text');

        // Visualization: Scale 0-100 to 0-100%
        const percentage = Math.max(0, Math.min(100, credits));
        bar.style.width = percentage + '%';
        text.textContent = `$${credits.toFixed(2)} global credits remaining`;

        if (credits <= 50) {
            bar.style.background = 'black';
            generateBtn.disabled = true;
            generateBtn.textContent = 'Credits Depleted';
        } else if (credits <= 55) {
            bar.style.background = '#ff4d4f'; // red
        } else if (credits <= 60) {
            bar.style.background = '#f59e0b'; // yellow
        } else {
            bar.style.background = '#10b981'; // green
        }
    } catch (e) {
        console.error("Credits fetch failed", e);
    }
}
updateCredits();

// Model Dropdown Logic
const dropdownTrigger = document.getElementById('model-dropdown-trigger');
const dropdownList = document.getElementById('model-dropdown-list');
const modelNameSpan = document.getElementById('current-model-name');
let avgTokens = 1000;
let modelPrices = {};

// Bootstrap the trigger value
dropdownTrigger.dataset.value = "qwen/qwen3.5-flash-02-23";

dropdownTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownList.classList.toggle('hidden');
});

// Close when clicking outside
window.addEventListener('click', () => {
    dropdownList.classList.add('hidden');
});

function formatSigDigit(n) {
    if (n === 0) return "0.00";
    const d = Math.max(1, Math.ceil(-Math.log10(n)));
    const power = Math.pow(10, d);
    return (Math.floor(n * power) / power).toFixed(d);
}

// Hourly Limit Tracking
function getHourlyState() {
    const now = Date.now();
    let state = window.firebaseHourlyState || {};
    if (!state.ts || (now - state.ts) > 3600000) { // reset every 1 hour
        state = { ts: now, count: 0, spent: 0 };
    }
    return state;
}

async function incrementHourlyRequests() {
    const state = getHourlyState();
    const currentModelId = dropdownTrigger.dataset.value || "qwen/qwen3.5-flash-02-23";
    const pricePerToken = parseFloat(modelPrices[currentModelId]) || 0.000005;
    const requestCost = avgTokens * pricePerToken;
    state.count++;
    state.spent = (Number(state.spent) || 0) + requestCost;
    state.ts = state.ts || Date.now();
    window.firebaseHourlyState = state;
    if (window.firebaseUser && window.firebaseDB && window.firebaseRef && window.firebaseSet) {
        const usageRef = window.firebaseRef(window.firebaseDB, `users/${window.firebaseUser.uid}/hourlyUsage`);
        await window.firebaseSet(usageRef, state);
    }
    calculateEstimatedCost(currentModelId);
    if (typeof window.blitzRefreshHourlyPanel === 'function') {
        window.blitzRefreshHourlyPanel();
    }
    if (typeof window.blitzAnimateAccountDrain === 'function') {
        window.blitzAnimateAccountDrain();
    }
}

function getRemainingHourlyRequests(modelId) {
    const state = getHourlyState();
    const pricePerToken = parseFloat(modelPrices[modelId]) || 0.000005; // fallback
    const estCost = avgTokens * pricePerToken;
    const balance = globalCredits;

    if (balance < 50) return 0;

    const tier = window.firebaseUserProfile?.tier || 'basic';
    const hourlyBudgetByTier = { basic: 0.03, gold: 0.04, diamond: 0.05 };
    const hourlyBudget = hourlyBudgetByTier[tier] || hourlyBudgetByTier.basic;
    const spent = Number(state.spent) || 0;
    const remainingBudget = Math.max(0, hourlyBudget - spent);
    return Math.max(0, Math.floor(remainingBudget / estCost));
}

async function updateModelStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        console.log("MARKET STATS FETCHED:", data);
        avgTokens = data.avgTokens || 1000;
        modelPrices = data.prices || {};

        // Update current cost estimate
        const currentModelId = dropdownTrigger.dataset.value || "qwen/qwen3.5-flash-02-23";
        calculateEstimatedCost(currentModelId);

        // Re-render dropdown list options with costs
        const listContainer = document.getElementById('model-list-items');

        const models = [
            { id: "qwen/qwen3.5-flash-02-23", name: "Qwen 3.5 Flash", type: "speed" },
            { id: "inception/mercury-2", name: "Mercury 2", type: "cost" },
            { id: "xiaomi/mimo-v2-omni", name: "Mimo v2 Omni", type: "performance" },
            { id: "openai/gpt-5.4-nano", name: "GPT 5.4 Nano", type: "speed" },
            { id: "moonshotai/kimi-k2.5", name: "Kimi K2.5", type: "performance" },
            { id: "kwaipilot/kat-coder-pro-v2", name: "KAT Coder Pro", type: "performance" },
            { id: "x-ai/grok-code-fast-1", name: "Grok-Code Fast", type: "speed" },
            { id: "google/gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite", type: "speed" },
            { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash Preview", type: "speed" },
            { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", type: "cost" },
            { id: "xiaomi/mimo-v2-flash", name: "Mimo v2 Flash", type: "speed" },
            { id: "xiaomi/mimo-v2-pro", name: "Mimo v2 Pro", type: "performance" }
        ];

        models.forEach(m => m.price = parseFloat(modelPrices[m.id]) || 0);

        let currentFilter = 'cost';

        const renderModels = () => {
            if (!listContainer) return;
            listContainer.innerHTML = '';
            
            let sortedModels = [...models];
            if (currentFilter === 'cost') {
                sortedModels.sort((a, b) => a.price - b.price);
            } else if (currentFilter === 'performance') {
                sortedModels.sort((a, b) => b.price - a.price); // higher price roughly maps to larger context/better intelligence
            } else if (currentFilter === 'speed') {
                // Prioritize designated high-speed models, then by lowest price acting as a proxy for speed
                sortedModels.sort((a, b) => {
                    if (a.type === 'speed' && b.type !== 'speed') return -1;
                    if (b.type === 'speed' && a.type !== 'speed') return 1;
                    return a.price - b.price;
                });
            }

            sortedModels.forEach(m => {
                const cost = formatSigDigit(avgTokens * m.price);
                const opt = document.createElement('div');
                opt.className = 'model-option';
                opt.dataset.value = m.id;
                opt.dataset.name = m.name;
                opt.textContent = m.name;
                const costSpan = document.createElement('span');
                costSpan.style.opacity = '0.5';
                costSpan.style.marginLeft = 'auto';
                costSpan.textContent = `~$${cost}/req`;
                opt.appendChild(costSpan);

                opt.addEventListener('click', () => {
                    dropdownTrigger.dataset.value = m.id;
                    modelNameSpan.textContent = m.name;
                    dropdownList.classList.add('hidden');
                    calculateEstimatedCost(m.id);
                });
                listContainer.appendChild(opt);
            });
        };

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            // Remove old listeners to avoid duplicates on re-render
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = '#a0aec0';
                });
                newBtn.classList.add('active');
                newBtn.style.background = '#2d3748';
                newBtn.style.color = '#fff';
                currentFilter = newBtn.dataset.sort;
                renderModels();
            });
        });

        renderModels();

    } catch (e) {
        console.error("Stats fetch failed", e);
    }
}

function calculateEstimatedCost(modelId) {
    const pricePerToken = parseFloat(modelPrices[modelId]) || 0;
    const estCost = formatSigDigit(avgTokens * pricePerToken);
    localStorage.setItem('blitz_estimated_request_cost', estCost);
    console.log(`Calculating cost for ${modelId}: ${avgTokens.toFixed(0)} avg tokens * ${pricePerToken.toFixed(9)} price = $${estCost}`);
    document.getElementById('avg-cost-val').textContent = `$${estCost}`;

    // Update Hourly Remaining
    const remaining = getRemainingHourlyRequests(modelId);
    document.getElementById('remaining-msgs-val').textContent = remaining;
    generateBtn.disabled = (remaining <= 0);
    generateBtn.style.opacity = (remaining <= 0) ? "0.3" : "1";
    generateBtn.style.cursor = (remaining <= 0) ? "not-allowed" : "pointer";
}

updateModelStats();
setInterval(updateModelStats, 5000); // refresh every 5s

const creditsModal = document.getElementById('credits-modal');
if (document.getElementById('btn-credits-about')) {
    document.getElementById('btn-credits-about').addEventListener('click', () => creditsModal.classList.remove('hidden'));
}
if (document.getElementById('btn-close-credits')) {
    document.getElementById('btn-close-credits').addEventListener('click', () => creditsModal.classList.add('hidden'));
}

function createToolCard(text, isDone, type, path, diffData) {
    const card = document.createElement('div');
    card.className = `tool-status-card ${isDone ? 'done' : ''} ${isDone ? 'clickable' : ''}`;

    card.style.display = "flex";
    card.style.margin = "12px 0";
    card.style.width = "100%";
    card.style.maxWidth = "400px";
    card.style.padding = "10px 16px";
    card.style.background = "#1a202c";
    card.style.border = "1px solid #2d3748";
    card.style.borderRadius = "8px";
    card.style.alignItems = "center";
    card.style.gap = "12px";
    card.style.cursor = isDone ? "pointer" : "default";
    card.style.transition = "transform 0.1s, background 0.2s";

    if (isDone) {
        card.style.borderColor = "#2f855a";
        const check = document.createElement('span');
        check.style.color = '#48bb78';
        check.style.fontWeight = 'bold';
        check.textContent = '✓';
        const label = document.createElement('span');
        label.style.fontSize = '13px';
        label.style.color = '#e2e8f0';
        label.textContent = text;
        const viewLabel = document.createElement('span');
        viewLabel.style.fontSize = '10px';
        viewLabel.style.opacity = '0.6';
        viewLabel.style.marginLeft = '8px';
        viewLabel.textContent = '(View)';
        label.appendChild(viewLabel);
        card.append(check, label);

        card.addEventListener('mouseenter', () => { card.style.background = "#2d3748"; card.style.transform = "translateY(-1px)"; });
        card.addEventListener('mouseleave', () => { card.style.background = "#1a202c"; card.style.transform = "none"; });

        card.addEventListener('click', () => {
            if (type === 'edit_file' && diffData) {
                const oldContent = files[diffData.path].model.getValue();
                const newContent = oldContent.replace(diffData.search, diffData.replace);
                showDiff(diffData.path, oldContent, newContent);
            } else if (path && files[path]) {
                switchToFile(path);
            }
        });
    } else {
        const spinner = document.createElement('img');
        spinner.className = 'status-loading-icon';
        spinner.src = loadingAssetPath;
        spinner.alt = 'Loading';
        const label = document.createElement('span');
        label.style.fontSize = '13px';
        label.style.color = '#e2e8f0';
        label.textContent = text;
        card.append(spinner, label);
    }
    return card;
}

function executeAiTools(content) {
    let contextAdded = false;

    // To-Do Read
    if (content.includes('<todo_read/>')) {
        let listText = "Current AI To-Do List:\n";
        if (todos.length === 0) listText += "(Empty)";
        todos.forEach((t, i) => {
            listText += `${i + 1}. [${t.done ? 'x' : ' '}] ${t.task}\n`;
        });
        chatMessages.push({ role: 'system', content: listText });
        contextAdded = true;
    }

    // To-Do Add
    const todoAddMatches = content.matchAll(/<todo_add task="([^"]+)"\/>/g);
    for (const match of todoAddMatches) {
        todos.push({ task: match[1], done: false });
    }

    // To-Do Check
    const todoCheckMatches = content.matchAll(/<todo_check task="([^"]+)"\/>/g);
    for (const match of todoCheckMatches) {
        const taskName = match[1];
        const t = todos.find(item => item.task === taskName);
        if (t) t.done = true;
    }

    // Moonshot / Kimi style: <|tool_call_begin|> functions.name:0 <|tool_call_argument_begin|> {...} <|tool_call_end|>
    const kimiMatches = content.matchAll(/<\|tool_call_begin\|> functions\.(\w+):\d+ <\|tool_call_argument_begin\|> ([\s\S]*?) <\|tool_call_end\|>/g);
    for (const match of kimiMatches) {
        const type = match[1];
        let args = {};
        try { args = JSON.parse(match[2].trim()); } catch (e) { }

        if (type === 'read_file' && args.path && files[args.path]) {
            chatMessages.push({ role: 'system', content: `Content of ${args.path}:\n${files[args.path].model.getValue()}` });
            contextAdded = true;
        } else if ((type === 'write_file' || type === 'create_file') && args.path) {
            aiCreateFile(args.path, args.content || "");
        } else if (type === 'edit_file' && args.path) {
            applyFileEdit(args.path, args.search, args.replace);
        } else if (type === 'delete_file' && args.path) {
            if (files[args.path]) deleteFile(args.path);
        } else if (type === 'todo_add' && args.task) {
            todos.push({ task: args.task, done: false });
        } else if (type === 'todo_check' && args.task) {
            const t = todos.find(item => item.task === args.task);
            if (t) t.done = true;
        } else if (type === 'read_codebase') {
            let codebaseData = "Current Codebase:\n";
            for (const path in files) codebaseData += `\n--- FILE: ${path} ---\n${files[path].model.getValue()}\n`;
            chatMessages.push({ role: 'system', content: codebaseData });
            contextAdded = true;
        } else if (type === 'search_codebase' && args.query) {
            let results = `Search results for "${args.query}":\n`;
            for (const path in files) {
                if (files[path].model.getValue().includes(args.query)) results += `- Found in: ${path}\n`;
            }
            chatMessages.push({ role: 'system', content: results });
            contextAdded = true;
        }
    }

    // Read Codebase
    if (content.includes('<read_codebase/>')) {
        let codebaseData = "Current Codebase:\n";
        for (const path in files) {
            codebaseData += `\n--- FILE: ${path} ---\n${files[path].model.getValue()}\n`;
        }
        chatMessages.push({ role: 'system', content: codebaseData });
        contextAdded = true;
    }

    // Search Codebase
    const searchMatches = content.matchAll(/<search_codebase>([\s\S]*?)<\/search_codebase>/g);
    for (const match of searchMatches) {
        const query = match[1].trim();
        let results = `Search results for "${query}":\n`;
        for (const path in files) {
            const content = files[path].model.getValue();
            if (content.includes(query)) {
                results += `- Found in: ${path}\n`;
            }
        }
        chatMessages.push({ role: 'system', content: results });
        contextAdded = true;
    }

    // Read Files
    const readMatches = content.matchAll(/<read_file path="([^"]+)"\/>/g);
    for (const match of readMatches) {
        const path = match[1];
        if (files[path]) {
            const fileData = files[path].model.getValue();
            chatMessages.push({ role: 'system', content: `Content of ${path}:\n${fileData}` });
            contextAdded = true;
        }
    }

    // Create/Write Files
    const writeMatches = content.matchAll(/<(write_file|create_file) path="([^"]+)">([\s\S]*?)<\/(write_file|create_file)>/g);
    for (const match of writeMatches) {
        aiCreateFile(match[2], match[3]);
    }

    // Edit Files (Search/Replace)
    const editMatches = content.matchAll(/<edit_file path="([^"]+)">\s*<search>([\s\S]*?)<\/search>\s*<replace>([\s\S]*?)<\/replace>\s*<\/edit_file>/g);
    for (const match of editMatches) {
        applyFileEdit(match[1], match[2], match[3]);
    }

    // Delete Files
    const deleteMatches = content.matchAll(/<delete_file path="([^"]+)"\/>/g);
    for (const match of deleteMatches) {
        if (files[match[1]]) deleteFile(match[1]);
    }

    return contextAdded;
}

setInterval(updateCredits, 5000);

// =========================================
// Firebase RTDB Save/Load Project Logic
// =========================================

function buildFallbackThumbnail(projectName = 'Untitled Project') {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const context = canvas.getContext('2d');
    if (!context) return null;

    const seedSource = `${projectName}|${Object.keys(files).sort().join('|')}`;
    let seed = 0;
    for (const char of seedSource) seed = ((seed << 5) - seed) + char.charCodeAt(0);
    const hue = Math.abs(seed) % 360;
    const accentHue = (hue + 36) % 360;
    const primary = `hsl(${hue} 65% 58%)`;
    const secondary = `hsl(${accentHue} 70% 48%)`;

    const gradient = context.createLinearGradient(0, 0, 400, 300);
    gradient.addColorStop(0, '#10131a');
    gradient.addColorStop(1, '#1b2330');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = primary;
    context.fillRect(24, 24, 352, 208);

    context.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i < 6; i += 1) {
        context.fillRect(48, 64 + (i * 24), 304 - (i * 18), 10);
    }

    context.fillStyle = secondary;
    context.fillRect(24, 246, 120, 20);

    context.fillStyle = '#ffffff';
    context.font = 'bold 28px Arial, sans-serif';
    context.fillText((projectName || 'Untitled Project').slice(0, 22), 28, 284);

    context.fillStyle = 'rgba(255, 255, 255, 0.75)';
    context.font = '16px Arial, sans-serif';
    context.fillText(`${Object.keys(files).length} file${Object.keys(files).length === 1 ? '' : 's'}`, 306, 282);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    console.log('[thumbnail] fallback thumbnail generated', { length: dataUrl.length });
    return dataUrl;
}

function svgToDataUrl(svgMarkup) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}

function inlineThumbnailAssets(iframeDoc, rendered) {
    for (const [filename, assetUrl] of Object.entries(rendered.assetUrls)) {
        if (filename.endsWith('.css')) {
            iframeDoc.querySelectorAll('link').forEach((linkEl) => {
                const href = linkEl.getAttribute('href');
                if (href === assetUrl) {
                    const styleEl = iframeDoc.createElement('style');
                    styleEl.textContent = files[filename]?.model.getValue() || '';
                    linkEl.replaceWith(styleEl);
                }
            });
            continue;
        }

        if (filename.endsWith('.js')) {
            iframeDoc.querySelectorAll('script').forEach((scriptEl) => {
                const src = scriptEl.getAttribute('src');
                if (src === assetUrl) {
                    scriptEl.removeAttribute('src');
                    scriptEl.textContent = '';
                }
            });
        }
    }
}

// Generate a tiny thumbnail from the preview iframe
async function captureThumbnail(projectName = 'Untitled Project') {
    const captureRoot = document.createElement('div');
    captureRoot.style.position = 'fixed';
    captureRoot.style.left = '-99999px';
    captureRoot.style.top = '0';
    captureRoot.style.width = '400px';
    captureRoot.style.height = '300px';
    captureRoot.style.overflow = 'hidden';
    captureRoot.style.background = '#ffffff';

    try {
        console.log('[thumbnail] capture start', { currentPreviewPage, fileCount: Object.keys(files).length });
        const rendered = buildRenderableHtml(currentPreviewPage);
        console.log('[thumbnail] renderable html ready', {
            page: rendered.pageToLoad,
            assetCount: Object.keys(rendered.assetUrls).length,
            htmlLength: rendered.htmlContent.length
        });
        const captureFrame = document.createElement('iframe');
        captureFrame.style.width = '400px';
        captureFrame.style.height = '300px';
        captureFrame.style.border = 'none';
        captureFrame.style.background = '#ffffff';
        captureRoot.appendChild(captureFrame);
        document.body.appendChild(captureRoot);

        const htmlBlobUrl = URL.createObjectURL(new Blob([rendered.htmlContent], { type: 'text/html' }));
        console.log('[thumbnail] blob url created');

        await new Promise((resolve) => {
            captureFrame.onload = () => {
                console.log('[thumbnail] iframe loaded');
                setTimeout(resolve, 400);
            };
            captureFrame.src = htmlBlobUrl;
        });

        const iframeDoc = captureFrame.contentDocument || captureFrame.contentWindow?.document;
        if (!iframeDoc?.documentElement) {
            console.warn('[thumbnail] iframe document missing');
            return null;
        }

        if (iframeDoc.fonts?.ready) {
            console.log('[thumbnail] waiting for fonts');
            await iframeDoc.fonts.ready.catch(() => {});
        }

        const assetLoads = Array.from(iframeDoc.images || []).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
            });
        });
        await Promise.all(assetLoads);
        console.log('[thumbnail] assets settled', { imageCount: (iframeDoc.images || []).length });

        inlineThumbnailAssets(iframeDoc, rendered);
        console.log('[thumbnail] local assets inlined');

        const serializedHtml = new XMLSerializer().serializeToString(iframeDoc.documentElement);
        const svgMarkup = `
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
                <foreignObject width="100%" height="100%">
                    ${serializedHtml}
                </foreignObject>
            </svg>
        `;
        console.log('[thumbnail] svg prepared', { length: svgMarkup.length });

        URL.revokeObjectURL(htmlBlobUrl);
        Object.values(rendered.assetUrls).forEach(URL.revokeObjectURL);
        const dataUrl = svgToDataUrl(svgMarkup);
        console.log('[thumbnail] data url generated', { length: dataUrl.length });
        return dataUrl;
    } catch (e) {
        console.warn("Thumbnail capture failed:", e);
        return buildFallbackThumbnail(projectName);
    } finally {
        captureRoot.remove();
    }
}

// Firebase RTDB keys can't contain ".", so we encode/decode
function encodeKey(k) { return k.replace(/\./g, '_DOT_'); }
function decodeKey(k) { return k.replace(/_DOT_/g, '.'); }

// Serialize all files to a plain object for RTDB
function serializeFiles() {
    const out = {};
    for (const [name, fileObj] of Object.entries(files)) {
        out[encodeKey(name)] = {
            content: fileObj.model.getValue(),
            lang: fileObj.lang
        };
    }
    return out;
}

// Save project to Firebase RTDB
async function saveProject() {
    if (!window.firebaseReady) {
        console.warn("Firebase not ready yet.");
        return;
    }

    try {
        await waitForAuth();
    } catch (error) {
        alert(error.message);
        return;
    }

    if (!currentUser) {
        alert("You must be signed in before saving.");
        return;
    }

    if (currentProjectId && currentProjectOwnerUid && currentProjectOwnerUid !== currentUser.uid) {
        alert("This project belongs to another user. Fork it to save your own copy.");
        return;
    }

    const projectName = prompt("Project name:", "My Blitz Project");
    if (!projectName) return;

    try {
        setSaveButtonLoading(true, 'Publishing');
        const thumbnail = await captureThumbnail(projectName);
        console.log('[thumbnail] save payload thumbnail result', thumbnail ? { length: thumbnail.length } : null);
        const hostedSlug = currentHostedSlug || slugifyProjectName(projectName);
        const publishPayload = {
            slug: hostedSlug,
            title: projectName,
            entry: 'index.html',
            files: buildPublishFilesPayload()
        };

        const publishResponse = await fetch(`${hostedPublishApiBase.replace(/\/$/, '')}/api/publish`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(publishPayload)
        });

        if (!publishResponse.ok) {
            const errorText = await publishResponse.text().catch(() => '');
            console.error("Publish failed:", publishResponse.status, errorText);
            alert(`Publish failed: ${errorText || publishResponse.statusText}`);
            return;
        }

        setSaveButtonLoading(true, 'Hosting');
        const publishData = await publishResponse.json().catch(() => ({}));
        const hostedWebsite = publishData.url || getHostedProjectUrl(hostedSlug);

        const projectPayload = {
            name: projectName,
            hostedSlug,
            hostedWebsite,
            ownerDisplayName: currentUser.displayName || currentUser.email || currentUser.uid,
            ownerPhotoURL: currentUser.photoURL || '',
            thumbnail,
            updatedAt: Date.now(),
            forkedFrom: forkSourceProject,
            ownerUid: currentUser.uid
        };
        console.log('[thumbnail] project payload prepared', {
            projectName,
            hasThumbnail: Boolean(thumbnail),
            payloadKeys: Object.keys(projectPayload)
        });

        let projectRef;
        if (currentProjectId) {
            // Update existing project
            projectRef = window.firebaseRef(window.firebaseDB, 'projects/' + currentProjectId);
            await window.firebaseSet(projectRef, projectPayload);
            currentProjectOwnerUid = currentUser.uid;
            console.log("Project updated:", currentProjectId);
        } else {
            // Create new project
            const projListRef = window.firebaseRef(window.firebaseDB, 'projects');
            const newRef = window.firebasePush(projListRef);
            currentProjectId = newRef.key;
            projectRef = newRef;
            await window.firebaseSet(projectRef, projectPayload);
            currentProjectOwnerUid = currentUser.uid;
            // Update URL so refreshes keep the project loaded
            history.replaceState(null, '', 'editor.html?project=' + currentProjectId);
            console.log("Project created:", currentProjectId);
        }

        currentHostedSlug = hostedSlug;
        currentHostedWebsite = hostedWebsite;
        updateSaveButtonState();
        alert("Project published!");
    } catch (e) {
        console.error("Save failed:", e);
        alert("Save failed: " + e.message);
    } finally {
        setSaveButtonLoading(false);
    }
}

// Load project from Firebase RTDB
async function loadProject(projectId) {
    if (!window.firebaseReady) {
        // Wait for Firebase to be ready
        window.addEventListener('firebase-ready', () => loadProject(projectId), { once: true });
        return;
    }

    try {
        const projRef = window.firebaseRef(window.firebaseDB, 'projects/' + projectId);
        const snapshot = await window.firebaseGet(projRef);
        if (!snapshot.exists()) {
            console.warn("Project not found:", projectId);
            return;
        }

        const data = snapshot.val();
        const isForkLoad = urlParams.get('forkOf') === projectId;
        currentProjectId = isForkLoad ? null : projectId;
        currentProjectOwnerUid = isForkLoad ? null : (data.ownerUid || null);
        forkSourceProject = isForkLoad
            ? { id: projectId, name: data.name || 'Untitled' }
            : (data.forkedFrom || null);
        currentHostedWebsite = data.hostedWebsite || null;
        currentHostedSlug = data.hostedSlug || null;

        if (currentHostedWebsite && !data.files) {
            window.location.href = `viewer.html?project=${projectId}`;
            return;
        }

        // Clear existing files
        for (const name in files) {
            files[name].model.dispose();
            delete files[name];
        }

        // Load files from RTDB (decode keys back from _DOT_ to .)
        if (data.files) {
            for (const [encodedName, fileInfo] of Object.entries(data.files)) {
                const name = decodeKey(encodedName);
                const lang = fileInfo.lang || 'plaintext';
                files[name] = {
                    model: monaco.editor.createModel(fileInfo.content || "", lang, monaco.Uri.file(name)),
                    lang: lang
                };
                bindContentChange(files[name].model);
            }
        }

        // Set active file
        activeFile = Object.keys(files)[0] || 'index.html';
        if (files[activeFile]) editor.setModel(files[activeFile].model);
        renderFiles();
        updatePreview();
        updateSaveButtonState();
        console.log("Project loaded:", projectId, data.name);
    } catch (e) {
        console.error("Load failed:", e);
    }
}

// Wire SAVE button
document.querySelector('.save-btn').addEventListener('click', saveProject);

// Check URL for ?project=ID on page load
const loadId = urlParams.get('project');
const forkId = urlParams.get('forkOf');
const sourceId = forkId || loadId;
if (sourceId) {
    if (window.firebaseReady) {
        loadProject(sourceId);
    } else {
        window.addEventListener('firebase-ready', () => loadProject(sourceId), { once: true });
    }
}
