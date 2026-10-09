#!/usr/bin/env node

/**
 * scaffolder.mjs
 * Starter application scaffolding generator for project archetypes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

export function scaffoldProject({ preset = 'fullstack-web', name = 'hackathon-app', desc = 'MVP Prototype', dev1 = 'Dev 1', dev2 = 'Dev 2', root = DEFAULT_ROOT }) {
  const srcDir = path.resolve(root, 'src');
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  if (preset === 'fullstack-web' || preset === 'frontend-dashboard') {
    const compDir = path.resolve(srcDir, 'components');
    fs.mkdirSync(compDir, { recursive: true });

    // 1. src/index.css
    const cssContent = `/* Tailwind / Design System Baseline Tokens */
@layer base {
  :root {
    --background: 220 20% 98%;
    --foreground: 220 20% 10%;
    --primary: 240 60% 55%;
    --primary-foreground: 0 0% 100%;
    --muted: 220 15% 92%;
    --radius: 0.5rem;
  }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-family: system-ui, -apple-system, sans-serif;
    margin: 0;
    padding: 0;
  }
}
`;
    fs.writeFileSync(path.join(srcDir, 'index.css'), cssContent, 'utf-8');

    // 2. src/components/Header.tsx
    const headerContent = `import React from 'react';

export interface HeaderProps {
  appName: string;
  dev1: string;
  dev2: string;
}

export const Header: React.FC<HeaderProps> = ({ appName, dev1, dev2 }) => {
  return (
    <header className="w-full border-b border-gray-200 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <span className="font-bold text-xl tracking-tight text-indigo-600">{appName}</span>
        <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-medium">MVP</span>
      </div>
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {dev1}</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {dev2}</span>
      </div>
    </header>
  );
};
`;
    fs.writeFileSync(path.join(compDir, 'Header.tsx'), headerContent, 'utf-8');

    // 3. src/App.tsx
    const appContent = `import React from 'react';
import { Header } from './components/Header';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header appName="${name}" dev1="${dev1}" dev2="${dev2}" />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-950 mb-4">
          ${name}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mb-8">
          ${desc}
        </p>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 text-left w-full max-w-lg">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Pair-Programming Status</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>🚀 <strong>Builder (Claude):</strong> Architecture & implementation in <code>src/</code></li>
            <li>🛡️ <strong>Gatekeeper (Antigravity):</strong> Test suites & baton verification</li>
            <li>👥 <strong>Team:</strong> ${dev1} (Dev 1) & ${dev2} (Dev 2)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
`;
    fs.writeFileSync(path.join(srcDir, 'App.tsx'), appContent, 'utf-8');
  } else if (preset === 'ai-agent-app') {
    // 1. src/config.py
    const configContent = `"""Agent Configuration and Environment Settings."""
import os

APP_NAME = "${name}"
APP_DESC = "${desc}"
DEV1 = "${dev1}"
DEV2 = "${dev2}"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
`;
    fs.writeFileSync(path.join(srcDir, 'config.py'), configContent, 'utf-8');

    // 2. src/pipeline.py
    const pipelineContent = `"""Agent Prompt Execution Pipeline."""
from src.config import APP_NAME

def execute_agent_step(task_input: str) -> dict:
    """Executes a single structured agent reasoning step."""
    if not task_input or not task_input.strip():
        raise ValueError("Task input cannot be empty.")
    
    return {
        "app": APP_NAME,
        "input": task_input,
        "status": "completed",
        "output": f"Processed: {task_input}"
    }
`;
    fs.writeFileSync(path.join(srcDir, 'pipeline.py'), pipelineContent, 'utf-8');

    // 3. src/api.py
    const apiContent = `"""Agent HTTP Service Route Handler."""
import json
from src.pipeline import execute_agent_step

def handle_request(payload_json: str) -> str:
    data = json.loads(payload_json)
    result = execute_agent_step(data.get("prompt", ""))
    return json.dumps(result)
`;
    fs.writeFileSync(path.join(srcDir, 'api.py'), apiContent, 'utf-8');
  } else {
    // minimal-hackathon
    // 1. src/index.html
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
    <div class="inline-block bg-indigo-500/20 text-indigo-400 font-semibold px-3 py-1 rounded-full text-xs mb-4">Hackathon Demo</div>
    <h1 class="text-3xl font-bold mb-2">${name}</h1>
    <p class="text-slate-400 mb-6">${desc}</p>
    <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 text-left text-sm text-slate-300 mb-6">
      <div class="flex justify-between py-1"><span>Dev 1:</span> <strong class="text-white">${dev1}</strong></div>
      <div class="flex justify-between py-1"><span>Dev 2:</span> <strong class="text-white">${dev2}</strong></div>
      <div class="flex justify-between py-1"><span>Clicks:</span> <strong id="counter" class="text-emerald-400">0</strong></div>
    </div>
    <button id="action-btn" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition">
      Trigger Demo Action
    </button>
  </div>
  <script src="app.js"></script>
</body>
</html>
`;
    fs.writeFileSync(path.join(srcDir, 'index.html'), htmlContent, 'utf-8');

    // 2. src/app.js
    const jsContent = `let count = 0;
const btn = document.getElementById('action-btn');
const counter = document.getElementById('counter');

if (btn && counter) {
  btn.addEventListener('click', () => {
    count++;
    counter.textContent = count;
  });
}
`;
    fs.writeFileSync(path.join(srcDir, 'app.js'), jsContent, 'utf-8');
  }

  return { success: true, srcDir, preset };
}

export async function main() {
  const args = process.argv.slice(2);
  let preset = 'fullstack-web';
  let name = 'MyHackApp';
  let desc = 'Rapid Prototype';
  let dev1 = 'Dev 1';
  let dev2 = 'Dev 2';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--preset' && args[i + 1]) preset = args[++i];
    if (args[i] === '--name' && args[i + 1]) name = args[++i];
    if (args[i] === '--desc' && args[i + 1]) desc = args[++i];
    if (args[i] === '--dev1' && args[i + 1]) dev1 = args[++i];
    if (args[i] === '--dev2' && args[i + 1]) dev2 = args[++i];
  }

  scaffoldProject({ preset, name, desc, dev1, dev2 });
  console.log(`[Scaffolder] Starter code generated in src/ for preset '\${preset}'.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
