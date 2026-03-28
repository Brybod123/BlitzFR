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

// Define initial contents
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

// Setup Monaco Models (Virtual File System)
let files = {
    'index.html': { model: monaco.editor.createModel(initialHtml, "html"), lang: 'html' },
    'styles.css': { model: monaco.editor.createModel(initialCss, "css"), lang: 'css' },
    'script.js': { model: monaco.editor.createModel(initialJs, "javascript"), lang: 'javascript' }
};

let activeFile = 'index.html';

// Create editor
const editor = monaco.editor.create(document.getElementById('monaco-container'), {
    model: files[activeFile].model,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
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

// Build Live Preview from all relevant files
function updatePreview() {
    try {
        let allHtml = "";
        let allCss = "";
        let allJs = "";

        Object.keys(files).forEach(f => {
            if (f.endsWith('.html')) allHtml += files[f].model.getValue() + "\n";
            else if (f.endsWith('.css')) allCss += files[f].model.getValue() + "\n";
            else if (f.endsWith('.js')) allJs += files[f].model.getValue() + "\n";
        });

        const finalHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>${allCss}</style>
</head>
<body>
    ${allHtml}
    <script>${allJs}<\/script>
</body>
</html>
        `;
        
        const blob = new Blob([finalHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        previewFrame.src = url;
        
        if (previewFrame.dataset.lastUrl) {
            URL.revokeObjectURL(previewFrame.dataset.lastUrl);
        }
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
        
        li.innerHTML = `<span>${icon}</span> <span>${filename}</span>
            <button class="file-item-delete" title="Delete">✕</button>`;
        
        li.addEventListener('click', (e) => {
            if(e.target.classList.contains('file-item-delete')) return;
            openFile(filename);
        });
        
        li.querySelector('.file-item-delete').addEventListener('click', (e) => {
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
        model: monaco.editor.createModel("", lang),
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
            model: monaco.editor.createModel(content, lang),
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
        } else {
            aiEditor.classList.remove('active');
            aiEditor.classList.add('hidden');
            codeView.classList.remove('hidden');
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
    const promptText = promptArea.value.trim();
    if (!promptText) return;

    chatMessages.push({ role: 'user', content: promptText });

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user-message';
    userMsg.innerHTML = `
        <span class="chat-avatar">U</span>
        <div class="chat-bubble">${marked.parse(promptText)}</div>
    `;
    chatHistory.appendChild(userMsg);
    promptArea.value = '';

    // Add AI loading message
    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-message ai-message';
    aiMsg.innerHTML = `
        <span class="chat-avatar">AI</span>
        <div class="chat-bubble">Generating your request...</div>
    `;
    chatHistory.appendChild(aiMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    generateBtn.disabled = true;
    const bubble = aiMsg.querySelector('.chat-bubble');

    await runChatLoop(bubble);
    generateBtn.disabled = false;
});

async function runChatLoop(bubble, turn = 1) {
    if (turn > 3) return;

    const fileContext = Object.keys(files).map(f => `- ${f}`).join('\n');
    const tempMessages = [
        ...chatMessages.slice(0, 1),
        { role: 'system', content: `Current files in project:\n${fileContext}\nProject context: This is a web project. index.html is the entry point.`},
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

function updateAiMessageUI(bubble, content) {
    bubble.innerHTML = '';
    
    // Updated regex including todo tools
    const regex = /(<(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check)[^>]*\/>|<(write_file|edit_file|create_file|search_codebase)[^>]*>[\s\S]*?<\/(write_file|edit_file|create_file|search_codebase)>)|(<(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check)[^>]*$|<(write_file|edit_file|create_file|search_codebase)[^>]*>[\s\S]*?$)/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const textBefore = content.substring(lastIndex, match.index);
        if (textBefore) {
            const span = document.createElement('span');
            span.innerHTML = marked.parse(textBefore);
            bubble.appendChild(span);
        }
        
        const fullMatch = match[0];
        const isComplete = !!match[1];
        
        const typeMatch = fullMatch.match(/<(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check)/);
        const type = typeMatch ? typeMatch[1] : "tool";
        const pathMatch = fullMatch.match(/path="([^"]+)"/);
        const taskMatch = fullMatch.match(/task="([^"]+)"/);
        const path = pathMatch ? pathMatch[1] : (taskMatch ? taskMatch[1] : "");
        
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
        
        // Capture diff data for edit_file if complete
        let diffData = null;
        if (type === 'edit_file' && isComplete) {
            const sm = fullMatch.match(/<search>([\s\S]*?)<\/search>/);
            const rm = fullMatch.match(/<replace>([\s\S]*?)<\/replace>/);
            if (sm && rm) diffData = { path, search: sm[1], replace: rm[1] };
        }

        bubble.appendChild(createToolCard(label, isComplete, type, path, diffData));
        lastIndex = regex.lastIndex;
    }
    
    const remainingText = content.substring(lastIndex);
    if (remainingText) {
        const span = document.createElement('span');
        span.innerHTML = marked.parse(remainingText);
        bubble.appendChild(span);
    }
}

// Credits Logic
async function updateCredits() {
    try {
        const res = await fetch('/api/credits');
        const { credits } = await res.json();
        const bar = document.getElementById('credits-bar');
        const text = document.getElementById('credits-text');
        
        // Visualization: Scale 0-100 to 0-100%
        const percentage = Math.max(0, Math.min(100, credits));
        bar.style.width = percentage + '%';
        text.textContent = `$${credits.toFixed(2)} credits remaining`;
        
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

async function updateModelStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        avgTokens = data.avgTokens || 1000;
        modelPrices = data.prices || {};
        
        // Update current cost estimate
        const currentModelId = dropdownTrigger.dataset.value || "qwen/qwen3.5-flash-02-23";
        calculateEstimatedCost(currentModelId);
        
        // Re-render dropdown list options with costs
        const list = document.getElementById('model-dropdown-list');
        list.innerHTML = '';
        
        const models = [
            { id: "qwen/qwen3.5-flash-02-23", name: "Qwen 3.5 Flash" },
            { id: "inception/mercury-2", name: "Mercury 2" },
            { id: "xiaomi/mimo-v2-omni", name: "Mimo v2 Omni" },
            { id: "openai/gpt-5.4-nano", name: "GPT 5.4 Nano" }
        ];


        models.forEach(m => {
            const price = parseFloat(modelPrices[m.id]) || 0;
            const cost = formatSigDigit(avgTokens * price);
            const opt = document.createElement('div');
            opt.className = 'model-option';
            opt.dataset.value = m.id;
            opt.dataset.name = m.name;
            opt.innerHTML = `${m.name} <span style="opacity: 0.5; margin-left: auto;">~$${cost}/req</span>`;
            
            opt.addEventListener('click', () => {
                dropdownTrigger.dataset.value = m.id;
                modelNameSpan.textContent = m.name;
                dropdownList.classList.add('hidden');
                calculateEstimatedCost(m.id);
            });
            list.appendChild(opt);
        });

    } catch (e) {
        console.error("Stats fetch failed", e);
    }
}

function calculateEstimatedCost(modelId) {
    const pricePerToken = parseFloat(modelPrices[modelId]) || 0;
    const estCost = formatSigDigit(avgTokens * pricePerToken);
    document.getElementById('avg-cost-val').textContent = `$${estCost}`;
}

updateModelStats();
setInterval(updateModelStats, 30000); // refresh every 30s

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
        card.innerHTML = `<span style="color: #48bb78; font-weight: bold;">✓</span> <span style="font-size: 13px; color: #e2e8f0;">${text} <span style="font-size: 10px; opacity: 0.6; margin-left: 8px;">(View)</span></span>`;
        
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
        card.innerHTML = `<div class="status-spinner" style="width: 14px; height: 14px; border: 2px solid rgba(74, 144, 226, 0.2); border-top-color: #4a90e2; border-radius: 50%; animation: spin 0.8s linear infinite;"></div> <span style="font-size: 13px; color: #e2e8f0;">${text}</span>`;
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
