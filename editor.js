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

// AI Generation Simulation
generateBtn.addEventListener('click', () => {
    const promptText = promptArea.value.trim();
    if (!promptText) return;

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user-message';
    userMsg.innerHTML = `
        <span class="chat-avatar">U</span>
        <div class="chat-bubble">${promptText}</div>
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

    // Simulate AI response
    setTimeout(() => {
        // Just mock updating index.html or styles.css for the demo
        if (files['index.html']) {
            files['index.html'].model.setValue(`<div class="result-container">\n    <h2 class="result-heading">Generated Result</h2>\n    <p class="echo">You asked for: ${promptText}</p>\n    <button class="action-btn">Generated Button</button>\n</div>`);
        }
        if (files['styles.css']) {
            files['styles.css'].model.setValue(`.result-container {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 30px;\n    font-family: sans-serif;\n}\n.result-heading {\n    color: #00ff88;\n}\n.echo {\n    color: #888888;\n}\n.action-btn {\n    background: #00ff88;\n    color: #000;\n    border: none;\n    padding: 15px 30px;\n    border-radius: 20px;\n    font-weight: bold;\n    cursor: pointer;\n}`);
        }
        if (files['script.js']) {
            files['script.js'].model.setValue(`document.querySelector('.action-btn')?.addEventListener('click', function() {\n    this.textContent = 'Action trigger!';\n});`);
        }
        
        // Update AI message
        aiMsg.querySelector('.chat-bubble').textContent = "I've generated the code for you! Your live preview has been updated. You can check the file tree to review or edit the files.";
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        generateBtn.disabled = false;
    }, 1500);
});
