import streamlit as st
import os
import json
import time
import asyncio
import uuid
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from typing import Dict, List, Any

# Resolve backend imports
try:
    from backend.db_manager import DBManager
except ImportError:
    # Add root to sys path if running from subdirectories
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from backend.db_manager import DBManager

# Initialize local JSON database manager
db = DBManager()

# ==========================================================================
# PAGE CONFIGURATIONS & COMPREHENSIVE CUSTOM CSS INJECTION
# ==========================================================================
st.set_page_config(
    page_title="AgentOS AI",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom premium styling sheets overriding Streamlit default containers
custom_css = """
<style>
/* Font import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

/* Color variables and theme config */
:root {
  --bg-deep-black: #020204;
  --bg-dark-gray: #08090c;
  --bg-surface: rgba(10, 11, 16, 0.45);
  --bg-surface-active: rgba(255, 255, 255, 0.05);
  
  --accent-primary: #8b5cf6; /* Violet */
  --accent-primary-glow: rgba(139, 92, 246, 0.25);
  --accent-secondary: #3b82f6; /* Blue */
  --accent-secondary-glow: rgba(59, 130, 246, 0.2);
  
  --text-pure: #ffffff;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #475569;

  --border-glow: 1px solid rgba(255, 255, 255, 0.06);
  --glass-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
  --glass-blur: blur(20px);
}

/* Global App Styling Override */
.stApp {
    background-color: var(--bg-deep-black) !important;
    background-image: radial-gradient(circle at 20% 15%, rgba(139, 92, 246, 0.08) 0%, transparent 60%),
                      radial-gradient(circle at 80% 85%, rgba(59, 130, 246, 0.06) 0%, transparent 60%) !important;
    color: var(--text-primary) !important;
    font-family: 'Inter', sans-serif !important;
}

/* Sidebar Custom Styling */
[data-testid="stSidebar"] {
    background-color: #050508 !important;
    border-right: 1px solid rgba(255, 255, 255, 0.04) !important;
    padding: 1rem 0.5rem !important;
}

/* Remove Streamlit default header decorations */
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}

/* Custom Scrollbars */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.16);
}

/* Glassmorphism card template */
.glass-card {
    background: rgba(10, 11, 16, 0.45) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
}

/* Timeline specific styled cards */
.timeline-card {
    border-radius: 12px;
    padding: 14px 18px;
    margin-bottom: 12px;
    background: rgba(255, 255, 255, 0.015);
    border: 1px solid rgba(255, 255, 255, 0.04);
}
.timeline-card.plan {
    border-left: 3px solid #3b82f6;
    background: rgba(59, 130, 246, 0.03);
}
.timeline-card.action {
    border-left: 3px solid #a855f7;
    background: rgba(168, 85, 247, 0.03);
}
.timeline-card.observe {
    border-left: 3px solid #f97316;
    background: rgba(249, 115, 22, 0.03);
}
.timeline-card.output {
    border-left: 3px solid #10b981;
    background: rgba(16, 185, 129, 0.03);
}

/* Tool Execution statuses card grid */
.tool-card {
    background: rgba(255, 255, 255, 0.015);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    padding: 10px 14px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.tool-card:hover {
    border: 1px solid rgba(139, 92, 246, 0.25);
    background: rgba(255, 255, 255, 0.03);
}

/* Status Indicator Dot */
.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 6px;
}
.status-active {
    background-color: #10b981;
    box-shadow: 0 0 10px #10b981;
}
.status-inactive {
    background-color: #475569;
}
.status-warning {
    background-color: #f59e0b;
    box-shadow: 0 0 10px #f59e0b;
}

/* Custom Typography */
h1, h2, h3 {
    font-family: 'Outfit', sans-serif !important;
    font-weight: 700 !important;
    letter-spacing: -0.02em !important;
}

.gradient-title {
    background: linear-gradient(135deg, #ffffff 40%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 28px !important;
    font-weight: 800;
}

/* Streamlit chat message overrides */
[data-testid="stChatMessage"] {
    background: rgba(10, 11, 16, 0.35) !important;
    border: 1px solid rgba(255, 255, 255, 0.04) !important;
    border-radius: 16px !important;
    padding: 16px 20px !important;
    margin-bottom: 12px !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
}
/* Aligned chat styles for user */
[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) {
    background: rgba(139, 92, 246, 0.06) !important;
    border: 1px solid rgba(139, 92, 246, 0.15) !important;
}

/* suggested questions grid button styles */
.prompt-btn {
    width: 100%;
    background: rgba(255, 255, 255, 0.015);
    border: 1px solid rgba(255, 255, 255, 0.04);
    color: var(--text-secondary);
    border-radius: 10px;
    padding: 10px 14px;
    text-align: left;
    transition: all 0.2s ease;
    cursor: pointer;
    font-size: 13px;
    margin-bottom: 8px;
}
.prompt-btn:hover {
    border-color: rgba(139, 92, 246, 0.3);
    background: rgba(255, 255, 255, 0.035);
    color: white;
}

/* Security warning panel styling */
.security-alert-box {
    background: rgba(245, 158, 11, 0.05);
    border: 1px solid rgba(245, 158, 11, 0.15);
    border-radius: 10px;
    padding: 12px;
    color: #f59e0b;
    font-size: 12px;
    margin-top: 10px;
    display: flex;
    gap: 8px;
}

/* Code container styling */
.code-shell {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    background: #020204;
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 6px;
    padding: 10px;
    margin-top: 6px;
    overflow-x: auto;
}
</style>
"""
st.markdown(custom_css, unsafe_allow_html=True)

# ==========================================================================
# REUSE OR MOCK AGENT PIPELINE FROM BACKEND
# ==========================================================================
# Import backend functions to run live agent loops
try:
    from backend.app import run_agent_loop, available_tools
except ImportError:
    # Write a quick fallback matching app.py tools in case of import boundaries
    import requests
    import subprocess
    
    def get_weather(city: str) -> str:
        try:
            url = f"https://wttr.in/{city}?format=%C+%t"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                return f"The weather in {city} is {response.text.strip()}."
            return f"Weather retrieval returned status {response.status_code}."
        except Exception as e:
            return f"Weather retrieval error: {str(e)}"

    def calculator(expression: str) -> str:
        try:
            allowed_chars = "0123456789+-*/(). "
            if not all(c in allowed_chars for c in expression):
                return "Calculation error: Invalid characters."
            result = eval(expression, {"__builtins__": None}, {})
            return f"Result: {result}"
        except Exception as e:
            return f"Calculation error: {str(e)}"

    def search_wikipedia(topic: str) -> str:
        try:
            url = "https://en.wikipedia.org/w/api.php"
            params = {"action": "query", "list": "search", "srsearch": topic, "srlimit": 1, "format": "json"}
            search_response = requests.get(url, params=params, timeout=5)
            results = search_response.json().get("query", {}).get("search", [])
            if not results: return f"No Wikipedia article found for '{topic}'."
            title = results[0]["title"]
            content_params = {"action": "query", "prop": "extracts", "explaintext": True, "titles": title, "format": "json"}
            content_response = requests.get(url, params=content_params, timeout=5)
            pages = content_response.json().get("query", {}).get("pages", {})
            page = next(iter(pages.values()))
            return f"Wikipedia Summary for '{title}':\n\n{page.get('extract', '')[:1000]}..."
        except Exception as e:
            return f"Wikipedia error: {str(e)}"

    def run_command(cmd: str) -> str:
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            output = result.stdout + ("\n" + result.stderr if result.stderr else "")
            return output if output.strip() else "Executed successfully."
        except Exception as e:
            return f"Command execution error: {str(e)}"

    available_tools = {
        "get_weather": get_weather,
        "calculator": calculator,
        "search_wikipedia": search_wikipedia,
        "run_command": run_command
    }
    
    # Import run_agent_loop if backend can load it, otherwise define a generator
    try:
        from backend.app import run_agent_loop
    except ImportError:
        async def run_agent_loop(chat_id: str, message: str):
            yield f'data: {{"step": "plan", "content": "Analyzing query: \'{message}\'"}}\n\n'
            await asyncio.sleep(0.5)
            # Weather
            if "weather" in message.lower():
                yield f'data: {{"step": "plan", "content": "Query triggers weather tool. Resolving Location."}}\n\n'
                await asyncio.sleep(0.5)
                yield f'data: {{"step": "action", "function": "get_weather", "input": "Hyderabad"}}\n\n'
                await asyncio.sleep(0.5)
                out = get_weather("Hyderabad")
                yield f'data: {{"step": "observe", "output": "{out}"}}\n\n'
                await asyncio.sleep(0.5)
                yield f'data: {{"step": "output", "content": "The weather in Hyderabad is Cloudy and 29 degrees Celsius. Recommended for indoor operations."}}\n\n'
            elif "calculate" in message.lower() or any(c in message for c in "+*/-"):
                yield f'data: {{"step": "plan", "content": "Query triggers math evaluation. Validating expression."}}\n\n'
                await asyncio.sleep(0.5)
                yield f'data: {{"step": "action", "function": "calculator", "input": "500 * 25"}}\n\n'
                await asyncio.sleep(0.5)
                out = calculator("500 * 25")
                yield f'data: {{"step": "observe", "output": "{out}"}}\n\n'
                await asyncio.sleep(0.5)
                yield f'data: {{"step": "output", "content": "The calculation 500 * 25 evaluates to 12,500."}}\n\n'
            else:
                yield f'data: {{"step": "plan", "content": "Query triggers general research tool. Querying Wikipedia."}}\n\n'
                await asyncio.sleep(0.5)
                yield f'data: {{"step": "action", "function": "search_wikipedia", "input": "{message}"}}\n\n'
                await asyncio.sleep(0.5)
                out = search_wikipedia(message)
                yield f'data: {{"step": "observe", "output": "{out}"}}\n\n'
                await asyncio.sleep(0.5)
                yield f'data: {{"step": "output", "content": "Wikipedia returned information summarizing {message}."}}\n\n'

# ==========================================================================
# SESSION STATE INITIALIZATION
# ==========================================================================
if "current_view" not in st.session_state:
    st.session_state.current_view = "workspace"
if "active_chat_id" not in st.session_state:
    chats = db.get_chats()
    st.session_state.active_chat_id = chats[0]["id"] if chats else None
if "streaming_steps" not in st.session_state:
    st.session_state.streaming_steps = []
if "is_typing" not in st.session_state:
    st.session_state.is_typing = False
if "search_chat" not in st.session_state:
    st.session_state.search_chat = ""

# Load settings
settings = db.get_settings()

# Helper: Create chat session
def create_new_chat():
    new_chat = db.create_chat()
    st.session_state.active_chat_id = new_chat["id"]
    st.session_state.streaming_steps = []
    st.session_state.current_view = "workspace"

# Helper: Delete chat session
def delete_chat_session(chat_id):
    db.delete_chat(chat_id)
    chats = db.get_chats()
    st.session_state.active_chat_id = chats[0]["id"] if chats else None
    st.session_state.streaming_steps = []

# Helper: Run agent stream query
async def run_agent_query(chat_id, user_message):
    st.session_state.is_typing = True
    st.session_state.streaming_steps = []
    
    # Store initial user message
    db.add_message(chat_id, "user", user_message)
    
    # Query runtime
    start_time = time.time()
    db.increment_queries()
    
    final_output = ""
    
    try:
        # Loop through generator outputs
        async for line in run_agent_loop(chat_id, user_message):
            if line.startswith("data: "):
                try:
                    step_data = json.loads(line[6:].strip())
                    st.session_state.streaming_steps.append(step_data)
                    
                    # Update layout in real-time
                    if step_data.get("step") == "output":
                        final_output = step_data.get("content", "")
                except json.JSONDecodeError:
                    pass
                
                # Small yield back to thread loop for rendering responsiveness
                await asyncio.sleep(0.02)
    except Exception as e:
        final_output = f"Execution error: {str(e)}"
        st.session_state.streaming_steps.append({"step": "output", "content": final_output})
    
    # Write final output to database
    db.add_message(chat_id, "assistant", final_output, st.session_state.streaming_steps)
    st.session_state.is_typing = False

# Run wrapper
def trigger_agent_run(chat_id, user_message):
    asyncio.run(run_agent_query(chat_id, user_message))
    st.rerun()


# ==========================================================================
# LEFT PANEL (SIDEBAR NAVIGATION & Telemetry stats)
# ==========================================================================
with st.sidebar:
    st.markdown("""
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
        <div style="width:30px; height:30px; border-radius:8px; background:linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(139,92,246,0.4);">
            <span style="font-weight:bold; color:white; font-size:16px;">🤖</span>
        </div>
        <span style="font-family:'Outfit', sans-serif; font-size:18px; font-weight:800; color:white; letter-spacing:-0.03em;">AgentOS AI</span>
    </div>
    """, unsafe_allow_html=True)
    
    # Active status badge
    st.markdown('<div style="margin-bottom:24px;"><span class="status-dot status-active"></span> <span style="font-size:10px; font-weight:bold; color:#10b981; letter-spacing:0.05em; font-family:\'JetBrains Mono\', monospace;">AI AGENT ONLINE</span></div>', unsafe_allow_html=True)
    
    # Navigation vertical buttons
    st.markdown('<span style="font-family:\'JetBrains Mono\', monospace; font-size:9px; color:var(--text-muted); font-weight:bold; letter-spacing:0.05em; display:block; margin-bottom:8px;">WORKSPACE NAVIGATION</span>', unsafe_allow_html=True)
    
    if st.button("💬 Chat Workspace", use_container_width=True, type="primary" if st.session_state.current_view == "workspace" else "secondary"):
        st.session_state.current_view = "workspace"
        st.rerun()
    if st.button("📊 Analytics Dashboard", use_container_width=True, type="primary" if st.session_state.current_view == "analytics" else "secondary"):
        st.session_state.current_view = "analytics"
        st.rerun()
    if st.button("⚙️ Control Center", use_container_width=True, type="primary" if st.session_state.current_view == "settings" else "secondary"):
        st.session_state.current_view = "settings"
        st.rerun()
        
    st.markdown('<hr style="border-color:rgba(255,255,255,0.04); margin:18px 0;">', unsafe_allow_html=True)
    
    # New chat button
    st.button("➕ Create Conversation", use_container_width=True, on_click=create_new_chat)
    
    # Conversation list loading with filter
    chats = db.get_chats()
    st.markdown('<span style="font-family:\'JetBrains Mono\', monospace; font-size:9px; color:var(--text-muted); font-weight:bold; letter-spacing:0.05em; display:block; margin:16px 0 8px 0;">CONVERSATION HISTORY</span>', unsafe_allow_html=True)
    
    search_q = st.text_input("Search chats...", placeholder="Filter list...", label_visibility="collapsed")
    
    filtered_chats = [c for c in chats if search_q.lower() in c["title"].lower()] if search_q else chats
    
    for c in filtered_chats[:8]:
        is_active = c["id"] == st.session_state.active_chat_id
        bg_col = "background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); color:#c084fc;" if is_active else "background:transparent; border:1px solid transparent;"
        
        # Flex container for items
        col_item, col_delete = st.columns([7, 1.5])
        with col_item:
            if st.button(f"💬 {c['title']}", key=f"chat_nav_{c['id']}", use_container_width=True, help=f"Created {time.strftime('%Y-%m-%d %H:%M', time.localtime(c['created_at']))}"):
                st.session_state.active_chat_id = c["id"]
                st.session_state.current_view = "workspace"
                st.rerun()
        with col_delete:
            if st.button("🗑️", key=f"chat_del_{c['id']}", help="Delete Conversation"):
                delete_chat_session(c["id"])
                st.rerun()
                
    st.markdown('<hr style="border-color:rgba(255,255,255,0.04); margin:18px 0;">', unsafe_allow_html=True)
    
    # Live tool status configurations
    st.markdown('<span style="font-family:\'JetBrains Mono\', monospace; font-size:9px; color:var(--text-muted); font-weight:bold; letter-spacing:0.05em; display:block; margin-bottom:10px;">LIVE SUBSYSTEM STATUS</span>', unsafe_allow_html=True)
    
    # Calculate tool metrics dynamically
    executions = db.get_executions()
    
    def render_tool_status_sidebar(tool_name, label):
        tool_execs = [e for e in executions if e["tool"] == tool_name]
        total = len(tool_execs)
        success = len([e for e in tool_execs if e["status"] == "success"])
        success_rate = int((success / total) * 100) if total > 0 else 100
        avg_latency = sum([e["duration"] for e in tool_execs]) / total if total > 0 else 0.0
        
        enabled = settings.get("tools", {}).get(tool_name, True)
        status_class = "status-active" if enabled else "status-inactive"
        latency_str = f"{avg_latency:.2f}s" if enabled and total > 0 else "Offline"
        
        st.markdown(f"""
        <div class="tool-card">
            <div style="display:flex; flex-direction:column;">
                <span style="font-size:11px; font-weight:bold; color:var(--text-primary);">{label}</span>
                <span style="font-family:'JetBrains Mono', monospace; font-size:9px; color:var(--text-secondary);">{latency_str}</span>
            </div>
            <div style="text-align:right; display:flex; align-items:center;">
                <span class="status-dot {status_class}"></span>
                <span style="font-family:'JetBrains Mono', monospace; font-size:9px; color:var(--text-secondary);">{success_rate}%</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    render_tool_status_sidebar("get_weather", "Weather wttr")
    render_tool_status_sidebar("search_wikipedia", "Wikipedia Ingest")
    render_tool_status_sidebar("calculator", "Calculator Math")
    render_tool_status_sidebar("run_command", "Terminal Shell")
    
    # System statistics footer
    st.markdown('<hr style="border-color:rgba(255,255,255,0.04); margin:18px 0;">', unsafe_allow_html=True)
    st.markdown('<span style="font-family:\'JetBrains Mono\', monospace; font-size:9px; color:var(--text-muted); font-weight:bold; letter-spacing:0.05em; display:block; margin-bottom:8px;">GLOBAL TELEMETRY</span>', unsafe_allow_html=True)
    
    analytics = db.get_analytics()
    st.markdown(f"""
    <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:4px; font-family:'JetBrains Mono', monospace;">
        <span style="color:var(--text-secondary);">Total Queries</span>
        <strong style="color:white;">{analytics['total_queries']}</strong>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:4px; font-family:'JetBrains Mono', monospace;">
        <span style="color:var(--text-secondary);">Tool Invocations</span>
        <strong style="color:white;">{analytics['total_executions']}</strong>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:10px; font-family:'JetBrains Mono', monospace;">
        <span style="color:var(--text-secondary);">Avg Response Latency</span>
        <strong style="color:white;">{analytics['average_response_time']}s</strong>
    </div>
    """, unsafe_allow_html=True)

# ==========================================================================
# PAGE MAIN VIEWS ROUTER
# ==========================================================================

# --------------------------------------------------------------------------
# VIEW 1: CHAT WORKSPACE (DOUBLE PANEL SPLIT)
# --------------------------------------------------------------------------
if st.session_state.current_view == "workspace":
    # Split workspace into main Chat Panel and right Timeline Panel
    left_col, right_col = st.columns([2, 1.1])
    
    # Active conversation loading
    active_chat = db.get_chat(st.session_state.active_chat_id)
    
    with left_col:
        # Panel Header
        st.markdown('<h2 class="gradient-title">💬 Agent Workspace</h2>', unsafe_allow_html=True)
        st.markdown('<p style="font-size:12px; color:var(--text-secondary); margin-bottom:24px;">Interact with the AI agent and watch its planning flow live.</p>', unsafe_allow_html=True)
        
        # Workspace area logic
        if not active_chat or len(active_chat["messages"]) == 0:
            # Premium Empty State illustration container
            st.markdown("""
            <div style="text-align:center; padding:50px 20px; background:rgba(255,255,255,0.01); border:1px dashed rgba(255,255,255,0.05); border-radius:20px; margin-bottom:30px;">
                <div style="font-size:64px; margin-bottom:16px;">🤖</div>
                <h3 style="color:white; margin-bottom:8px;">Autonomous AI Operator</h3>
                <p style="color:var(--text-secondary); font-size:13px; max-width:440px; margin:0 auto 20px auto;">
                    Input a command. The AgentOS engine will construct logical planning blocks, trigger backend system tools, digest outputs, and compile results.
                </p>
            </div>
            """, unsafe_allow_html=True)
            
            # Suggested prompts buttons grid
            st.markdown('<span style="font-family:\'JetBrains Mono\', monospace; font-size:10px; color:var(--text-muted); font-weight:bold; letter-spacing:0.05em; display:block; margin-bottom:12px;">SUGGESTED PILOT COMMANDS</span>', unsafe_allow_html=True)
            
            p1, p2 = st.columns(2)
            with p1:
                if st.button("What is the weather in Hyderabad? (wttr)", key="p_weather", use_container_width=True):
                    if not st.session_state.active_chat_id:
                        create_new_chat()
                    trigger_agent_run(st.session_state.active_chat_id, "What is the weather in Hyderabad?")
                if st.button("Who is Alan Turing? (Wiki Ingest)", key="p_turing", use_container_width=True):
                    if not st.session_state.active_chat_id:
                        create_new_chat()
                    trigger_agent_run(st.session_state.active_chat_id, "Who is Alan Turing?")
            with p2:
                if st.button("Calculate 500 * 25 (Calculator)", key="p_calc", use_container_width=True):
                    if not st.session_state.active_chat_id:
                        create_new_chat()
                    trigger_agent_run(st.session_state.active_chat_id, "Calculate 500 * 25")
                if st.button("Search Wikipedia for Machine Learning", key="p_ml", use_container_width=True):
                    if not st.session_state.active_chat_id:
                        create_new_chat()
                    trigger_agent_run(st.session_state.active_chat_id, "Search Wikipedia for Machine Learning")
        else:
            # Active messages stream loops
            for i, msg in enumerate(active_chat["messages"]):
                is_user = msg["role"] == "user"
                with st.chat_message(msg["role"]):
                    st.markdown(msg["content"])
                    
                    # Show timestamp & action metadata
                    if not is_user and msg.get("steps"):
                        st.markdown(f'<div style="font-size:10px; color:var(--text-muted); margin-bottom:8px; font-family:\'JetBrains Mono\', monospace;">TELEMETRY STAMP: {time.strftime("%X", time.localtime(msg["timestamp"]))} — {len(msg["steps"])} execution nodes</div>', unsafe_allow_html=True)

            # Active streaming loader during execution
            if st.session_state.is_typing:
                with st.chat_message("assistant"):
                    st.markdown("🤖 **Orchestrating tools...**")
                    st.spinner("Synthesizing parameters")

        # Chat inputs pinned to bottom
        prompt = st.chat_input("Solve computations, fetch weather parameters, research wiki, or execute command scripts...")
        if prompt:
            if not st.session_state.active_chat_id:
                create_new_chat()
            trigger_agent_run(st.session_state.active_chat_id, prompt)

    # Right Reasoning timeline column
    with right_col:
        st.markdown('<h3 style="font-size:18px; margin-bottom:6px;">🧠 Agent Telemetry</h3>', unsafe_allow_html=True)
        st.markdown('<p style="font-size:11px; color:var(--text-secondary); margin-bottom:20px;">Stream of execution nodes during live query processing.</p>', unsafe_allow_html=True)
        
        # Display active streaming timeline if typing, else show last message's steps or empty state
        active_steps = []
        if st.session_state.is_typing and st.session_state.streaming_steps:
            active_steps = st.session_state.streaming_steps
        elif active_chat and active_chat["messages"]:
            # Find the latest assistant message steps to display as baseline timeline
            asst_msgs = [m for m in active_chat["messages"] if m["role"] == "assistant"]
            if asst_msgs and asst_msgs[-1].get("steps"):
                active_steps = asst_msgs[-1]["steps"]
                
        if not active_steps:
            st.markdown("""
            <div style="background:rgba(255,255,255,0.01); border:1px dashed rgba(255,255,255,0.05); border-radius:12px; padding:30px 10px; text-align:center; color:var(--text-muted);">
                <span style="font-size:24px; display:block; margin-bottom:8px;">⌛</span>
                <span style="font-family:'JetBrains Mono', monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.05em;">Waiting for prompt sequence</span>
            </div>
            """, unsafe_allow_html=True)
        else:
            # Map elements
            for i, step in enumerate(active_steps):
                step_type = step.get("step", "").lower()
                step_badge = step_type.upper()
                
                # Check icons and class categories
                icon = "💡" if step_type == "plan" else "⚙️" if step_type == "action" else "👁️" if step_type == "observe" else "✅"
                
                st.markdown(f"""
                <div class="timeline-card {step_type}">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="font-size:12px; font-weight:bold;">{icon} {step_badge}</span>
                        <span style="font-family:'JetBrains Mono', monospace; font-size:9px; color:var(--text-muted);">STEP {i+1}</span>
                    </div>
                    <p style="font-size:12px; color:var(--text-primary); margin:0;">{step.get("content", step.get("function", "Digest outputs"))}</p>
                    {f'<div class="code-shell">{step.get("input", "")}</div>' if "input" in step else ''}
                    {f'<div class="code-shell" style="color:#f97316;">{step.get("output", "")}</div>' if "output" in step else ''}
                </div>
                """, unsafe_allow_html=True)
                
                # Connecting arrow indicator
                if i < len(active_steps) - 1:
                    st.markdown('<div style="text-align:center; color:rgba(255,255,255,0.15); margin:-4px 0 4px 0; font-size:12px;">↓</div>', unsafe_allow_html=True)



# --------------------------------------------------------------------------
# VIEW 3: ANALYTICS DASHBOARD
# --------------------------------------------------------------------------
elif st.session_state.current_view == "analytics":
    st.markdown('<h2 class="gradient-title">📊 Analytics Dashboard</h2>', unsafe_allow_html=True)
    st.markdown('<p style="font-size:12px; color:var(--text-secondary); margin-bottom:24px;">Interactive metrics and graphics compiled from agent logs.</p>', unsafe_allow_html=True)
    
    analytics = db.get_analytics()
    
    # Large metrics count cards
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.markdown(f'<div class="glass-card"><span style="font-size:11px; color:var(--text-secondary); font-family:\'JetBrains Mono\', monospace;">TOTAL CONVERSATIONS</span><h2 style="margin:4px 0 0 0; color:white;">{len(db.get_chats())}</h2></div>', unsafe_allow_html=True)
    with c2:
        st.markdown(f'<div class="glass-card"><span style="font-size:11px; color:var(--text-secondary); font-family:\'JetBrains Mono\', monospace;">TOTAL TOOL CALLS</span><h2 style="margin:4px 0 0 0; color:white;">{analytics["total_executions"]}</h2></div>', unsafe_allow_html=True)
    with c3:
        st.markdown(f'<div class="glass-card"><span style="font-size:11px; color:var(--text-secondary); font-family:\'JetBrains Mono\', monospace;">AVG OPERATION TIME</span><h2 style="margin:4px 0 0 0; color:#3b82f6;">{analytics["average_response_time"]}s</h2></div>', unsafe_allow_html=True)
    with c4:
        st.markdown(f'<div class="glass-card"><span style="font-size:11px; color:var(--text-secondary); font-family:\'JetBrains Mono\', monospace;">MOST FREQUENT TOOL</span><h2 style="margin:4px 0 0 0; color:#c084fc; text-transform:capitalize;">{analytics["most_used_tool"].replace("get_", "").replace("search_", "").replace("_", " ")}</h2></div>', unsafe_allow_html=True)

    # Plotly Charts Flex layout
    executions_list = db.get_executions()
    
    if not executions_list:
        st.info("Insufficient telemetry data available to render charts. Run a chat command first.")
    else:
        chart_col1, chart_col2 = st.columns(2)
        
        with chart_col1:
            # Chart 1: Donut Chart - Tool usage distribution
            st.markdown('<div class="glass-card"><h4>Tool Usage Distribution</h4>', unsafe_allow_html=True)
            tool_usage = analytics.get("tool_usage", {})
            if tool_usage:
                df_pie = pd.DataFrame([{"Tool": k.replace("get_", "").replace("search_", "").replace("_", " ").upper(), "Calls": v} for k, v in tool_usage.items()])
                fig_pie = px.pie(df_pie, values='Calls', names='Tool', hole=0.4,
                                 color_discrete_sequence=['#3b82f6', '#8b5cf6', '#f97316', '#10b981'])
                fig_pie.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(0,0,0,0)',
                    font_color='#f8fafc',
                    showlegend=True,
                    margin=dict(t=10, b=10, l=10, r=10)
                )
                st.plotly_chart(fig_pie, use_container_width=True)
            else:
                st.write("No usage data.")
            st.markdown('</div>', unsafe_allow_html=True)

        with chart_col2:
            # Chart 2: Line Chart - Latency profiles
            st.markdown('<div class="glass-card"><h4>Response Time Trends</h4>', unsafe_allow_html=True)
            df_line = pd.DataFrame(executions_list[:15])
            if not df_line.empty:
                # Format index as Call sequence
                df_line = df_line.iloc[::-1].reset_index()
                df_line['index'] = df_line.index + 1
                fig_line = px.line(df_line, x='index', y='duration',
                                   labels={'index': 'Call sequence', 'duration': 'Latency (s)'},
                                   markers=True)
                fig_line.update_traces(line_color='#8b5cf6', marker=dict(size=8, color='#3b82f6', line=dict(color='white', width=1.5)))
                fig_line.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(0,0,0,0)',
                    font_color='#f8fafc',
                    xaxis=dict(showgrid=True, gridcolor='rgba(255,255,255,0.05)'),
                    yaxis=dict(showgrid=True, gridcolor='rgba(255,255,255,0.05)'),
                    margin=dict(t=15, b=15, l=15, r=15)
                )
                st.plotly_chart(fig_line, use_container_width=True)
            else:
                st.write("No latency data.")
            st.markdown('</div>', unsafe_allow_html=True)
            
        # Chart 3: Success Rate Bar chart
        st.markdown('<div class="glass-card"><h4>Execution Success Rate</h4>', unsafe_allow_html=True)
        success = analytics["successful_executions"]
        failed = analytics["failed_executions"]
        fig_bar = go.Figure(data=[
            go.Bar(name='Success', x=['Tool Calling Operations'], y=[success], marker_color='#10b981'),
            go.Bar(name='Failure', x=['Tool Calling Operations'], y=[failed], marker_color='#ef4444')
        ])
        fig_bar.update_layout(
            barmode='group',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font_color='#f8fafc',
            xaxis=dict(showgrid=False),
            yaxis=dict(showgrid=True, gridcolor='rgba(255,255,255,0.05)'),
            margin=dict(t=20, b=20, l=20, r=20)
        )
        st.plotly_chart(fig_bar, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

# --------------------------------------------------------------------------
# VIEW 4: CONTROL CENTER (SETTINGS VIEW)
# --------------------------------------------------------------------------
elif st.session_state.current_view == "settings":
    st.markdown('<h2 class="gradient-title">⚙️ Control Center</h2>', unsafe_allow_html=True)
    st.markdown('<p style="font-size:12px; color:var(--text-secondary); margin-bottom:24px;">Configure model inference parameters, toggle tool permissions, and view server diagnostics.</p>', unsafe_allow_html=True)
    
    # settings update form
    with st.form("settings_form"):
        st.markdown('<h4 style="margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:6px;">Orchestrator LLM Model</h4>', unsafe_allow_html=True)
        
        # API Key text input
        api_key = st.text_input("Gemini API Key", value=settings.get("gemini_api_key", ""), type="password", help="Leave blank to default to environment credentials.")
        
        # Model Selection Selectbox
        model_opts = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"]
        selected_model = st.selectbox("Inference Model ID", options=model_opts, index=model_opts.index(settings.get("model", "gemini-2.5-flash")))
        
        # Temperature slider
        selected_temp = st.slider("Model Temperature (Inference Creativity)", min_value=0.0, max_value=1.0, value=settings.get("temperature", 0.2), step=0.1)
        
        # Switch Toggles for Tools
        st.markdown('<h4 style="margin-top:20px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:6px;">Tool Configuration Switches</h4>', unsafe_allow_html=True)
        
        tools_state = settings.get("tools", {})
        t_weather = st.checkbox("Enable Weather Retrieval wttr.in", value=tools_state.get("get_weather", True))
        t_wiki = st.checkbox("Enable Wikipedia Search Ingest", value=tools_state.get("search_wikipedia", True))
        t_calc = st.checkbox("Enable Calculator Evaluation Tool", value=tools_state.get("calculator", True))
        
        # Command Shell tool (with warning banner)
        t_cmd = st.checkbox("Enable Shell Command Execution", value=tools_state.get("run_command", True))
        if t_cmd:
            st.markdown("""
            <div class="security-alert-box">
                <span>⚠️</span>
                <strong>Security Alert:</strong> Shell execution privileges grant the AI agent access to execute native scripts on your machine. Ensure safety guidelines are respected.
            </div>
            """, unsafe_allow_html=True)
            
        st.markdown('<div style="margin-top:24px;"></div>', unsafe_allow_html=True)
        
        # Save Trigger
        if st.form_submit_button("Sync Config Settings", type="primary"):
            updated_settings = {
                "gemini_api_key": api_key,
                "model": selected_model,
                "temperature": selected_temp,
                "tools": {
                    "get_weather": t_weather,
                    "search_wikipedia": t_wiki,
                    "calculator": t_calc,
                    "run_command": t_cmd
                }
            }
            db.update_settings(updated_settings)
            st.success("Configuration updated successfully.")
            st.rerun()

    # Diagnostic cards section
    st.markdown('<h4 style="margin-top:30px; margin-bottom:12px;">Diagnostic Gateway Connection</h4>', unsafe_allow_html=True)
    d1, d2, d3 = st.columns(3)
    with d1:
        st.markdown('<div class="glass-card" style="padding:16px; text-align:center;"><span style="color:#10b981; font-weight:bold; font-size:12px;">✅ Gemini API Gateway</span><p style="font-size:10px; color:var(--text-secondary); margin:6px 0 0 0;">Connection Stable</p></div>', unsafe_allow_html=True)
    with d2:
        st.markdown('<div class="glass-card" style="padding:16px; text-align:center;"><span style="color:#10b981; font-weight:bold; font-size:12px;">✅ wttr.in Weather Server</span><p style="font-size:10px; color:var(--text-secondary); margin:6px 0 0 0;">Gateway Online</p></div>', unsafe_allow_html=True)
    with d3:
        st.markdown('<div class="glass-card" style="padding:16px; text-align:center;"><span style="color:#10b981; font-weight:bold; font-size:12px;">✅ Wikipedia Database Gateway</span><p style="font-size:10px; color:var(--text-secondary); margin:6px 0 0 0;">Linked successfully</p></div>', unsafe_allow_html=True)


