# 🤖 Astra Agent: Premium Autonomous AI Workspace

Astra Agent is a portfolio-grade, high-performance autonomous AI Operator built as a unified Streamlit application. Designed with modern design aesthetics, it features a glassmorphic dark-theme console, real-time reasoning visualization, and advanced telemetry analytics.

---

## ✨ Features & Highlights

### 🎨 Glassmorphic Visual Design
- **High-Contrast Dark Theme:** Styled with deep slate, obsidian, and glowing violet/blue radial gradients.
- **Dynamic CSS Overrides:** Bypasses default Streamlit styling to render sleek, semi-transparent card layouts, customized scrollbars, and styled container blocks.

### 🧠 Live Telemetry & Reasoning Panel
- **Planning Pipeline:** Displays every step of the agent's internal monologue in real-time (`PLAN` ➔ `ACTION` ➔ `OBSERVE` ➔ `OUTPUT`).
- **Telemetry Truncation:** Automatically truncates raw tool observation outputs to a maximum of 3 lines to maintain a clean timeline, while keeping full text responses inside the final chat output.
- **Micro-Animations:** Highlights execution statuses and active background workers.

### 📊 Analytics Dashboard
- **Usage Metrics:** Highlights total queries, response latencies, and most-used subsystems.
- **Donut Chart:** Visualizes distribution of active tool invocations via interactive Plotly charts.
- **Latency Line Graph:** Tracks operational latency across sequential executions.
- **Success vs. Failure Bar Graph:** Records overall system reliability rates.

### ⚙️ Control Center
- **Model Toggles:** Switch between inference engines (Gemini models) and tune temperature profiles.
- **Tool Permission Switcher:** Globally toggle tools on/off. When disabled, the agent dynamically adjusts its planning flow to use alternate tools.
- **Security Guardrails:** Shows active terminal execution warning flags.

---

## 🛠️ Codebase Architecture

```filepath
├── app.py                  # Primary Streamlit Dashboard (Workspace, Analytics, Settings)
├── backend/
│   ├── app.py              # Core Agent Loop, LLM Prompts, and FastAPI Gateway API
│   ├── db_manager.py       # JSON Database manager for telemetry, settings, and histories
│   └── data/
│       └── db.json         # Unified Local Database (Chats history, telemetry logs, settings)
├── .streamlit/
│   └── config.toml         # Native Streamlit layout configurations and styling tokens
└── README.md               # Product Documentation
```

---

## 🔧 Supported Subsystem Tools

1. **Weather Gateway (wttr.in):** Fetches real-time weather summaries for cities.
2. **Wikipedia Ingestion Gateway:** Searches articles and ingests summaries.
3. **Calculator (Math Parser):** Evaluates mathematical expressions.
4. **Shell Terminal Executor:** Runs console commands locally with custom timeout limits.

---

## 🚀 Getting Started

### 1. Install Dependencies
Make sure you have python installed, then run:
```bash
pip install streamlit pandas plotly openai requests
```

### 2. Launch the Application
Run the Streamlit server from the root of the project workspace:
```bash
streamlit run app.py
```

Open the local portal url (typically `http://localhost:8501`) in your browser to start interacting.

---

## 🛡️ Settings & Credentials
Credentials and model configuration can be adjusted under the **⚙️ Control Center** view inside the sidebar panel. Ensure your `GEMINI_API_KEY` is loaded in your environment variables, or sync it directly inside the app settings form.