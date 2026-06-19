import os
import json
import time
import asyncio
import requests
import subprocess
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from openai import OpenAI
try:
    from backend.db_manager import DBManager
except ModuleNotFoundError:
    from db_manager import DBManager

app = FastAPI(title="Astra Agent Backend")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = DBManager()

# Tool Definitions
def get_weather(city: str) -> str:
    try:
        url = f"https://wttr.in/{city}?format=%C+%t"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return f"The weather in {city} is {response.text.strip()}."
        return f"Could not retrieve weather for {city}. Service returned status {response.status_code}."
    except Exception as e:
        return f"Weather retrieval error: {str(e)}"

def calculator(expression: str) -> str:
    try:
        # Basic sanitization for safety
        allowed_chars = "0123456789+-*/(). "
        if not all(c in allowed_chars for c in expression):
            return "Calculation error: Invalid characters detected."
        # Evaluate safely
        result = eval(expression, {"__builtins__": None}, {})
        return f"The result of {expression} is {result}"
    except Exception as e:
        return f"Calculation error: {str(e)}"

def search_wikipedia(topic: str) -> str:
    try:
        url = "https://en.wikipedia.org/w/api.php"
        headers = {"User-Agent": "Astra-Agent/1.0"}
        
        # Search article
        search_params = {
            "action": "query",
            "list": "search",
            "srsearch": topic,
            "srlimit": 1,
            "format": "json"
        }
        
        search_response = requests.get(url, params=search_params, headers=headers, timeout=5)
        if search_response.status_code != 200:
            return "Wikipedia search failed."
            
        search_data = search_response.json()
        results = search_data.get("query", {}).get("search", [])
        if not results:
            return f"No Wikipedia article found for '{topic}'."
            
        title = results[0]["title"]
        
        # Get article content
        content_params = {
            "action": "query",
            "prop": "extracts",
            "explaintext": True,
            "titles": title,
            "format": "json"
        }
        
        content_response = requests.get(url, params=content_params, headers=headers, timeout=5)
        if content_response.status_code != 200:
            return f"Wikipedia failed to load article '{title}'."
            
        content_data = content_response.json()
        pages = content_data.get("query", {}).get("pages", {})
        page = next(iter(pages.values()))
        article = page.get("extract", "No article content found.")
        
        return f"Wikipedia Article: {title}\n\n{article[:1500]}..."
    except Exception as e:
        return f"Wikipedia search error: {str(e)}"

def run_command(cmd: str) -> str:
    # Check if run_command is enabled in settings (for security)
    settings = db.get_settings()
    if not settings.get("tools", {}).get("run_command", True):
        return "Command Execution Tool is currently disabled in settings."
        
    try:
        # Run command with a 10s timeout and return stdout/stderr
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=10
        )
        output = result.stdout
        if result.stderr:
            output += "\n" + result.stderr
        if not output.strip():
            output = f"Command executed successfully (exit code {result.returncode})."
        return output[:2000] # Limit output size
    except subprocess.TimeoutExpired:
        return "Command execution timed out after 10 seconds."
    except Exception as e:
        return f"Command execution error: {str(e)}"

# Mapping of tools
available_tools = {
    "get_weather": get_weather,
    "calculator": calculator,
    "search_wikipedia": search_wikipedia,
    "run_command": run_command
}

# SYSTEM PROMPT
SYSTEM_PROMPT = """You are an helpful AI Assistant who is specialized in resolving user query.
You work on start, plan, action, observe mode.

For the given user query and available tools, plan the step by step execution, based on the planning,
select the relevant tool from the available tool. and based on the tool selection you perform an action to call the tool.
Wait for the observation and based on the observation from the tool call resolve the user query.

Rules:
- Follow the Output JSON Format.
- Always perform one step at a time and wait for next input.
- Carefully analyse the user query.
- Don't do all steps one at a time, go one by one, step by step response.

Output JSON Format:
{
    "step": "plan" | "action" | "output",
    "content": "Description of plan or final output",
    "function": "The name of function if the step is action",
    "input": "The input parameter for the function"
}

Available Tools:
- "get_weather": Takes a city name as an input and returns the current weather for the city.
- "calculator": Takes a mathematical expression as string and solves it.
- "search_wikipedia": Takes a topic name as input and returns information from Wikipedia.
- "run_command": Takes a system command as a string and executes the command and returns the output.

Example:
User Query: What is the weather of new york?
Output: { "step": "plan", "content": "The user is interested in weather data of new york" }
Output: { "step": "plan", "content": "From the available tools I should call get_weather" }
Output: { "step": "action", "function": "get_weather", "input": "new york" }
Output: { "step": "observe", "output": "12 Degree Cel" }
Output: { "step": "output", "content": "The weather for new york seems to be 12 degrees." }
"""

class ChatRequest(BaseModel):
    chat_id: Optional[str] = None
    message: str

class SettingsUpdate(BaseModel):
    gemini_api_key: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    tools: Optional[Dict[str, bool]] = None

# Mock Agent Simulation
async def run_mock_agent(message: str, active_tools: Dict[str, bool]):
    msg_lower = message.lower()
    
    # 1. Plan step 1
    yield {"step": "plan", "content": f"Analyzing user request: '{message}'"}
    await asyncio.sleep(0.8)
    
    # Identify which tool matches
    matched_tool = None
    tool_input = ""
    
    if "weather" in msg_lower:
        # Extract city
        words = message.split()
        city = "Hyderabad"
        for i, word in enumerate(words):
            if word.lower() in ["in", "at", "for"] and i + 1 < len(words):
                city = words[i+1].strip("?.!,")
                break
        matched_tool = "get_weather"
        tool_input = city
    elif any(op in msg_lower for op in ["*", "+", "/", "-", "calculate", "solve", "math"]):
        # Extract math expression
        expression = ""
        for char in message:
            if char in "0123456789+-*/(). ":
                expression += char
        expression = expression.strip()
        if not expression:
            expression = "500 * 24" # fallback example
        matched_tool = "calculator"
        tool_input = expression
    elif any(k in msg_lower for k in ["wikipedia", "search", "who is", "what is", "about"]):
        # Extract topic
        topic = message
        for phrase in ["search wikipedia for", "search wikipedia", "wikipedia", "who is", "what is", "about"]:
            if phrase in msg_lower:
                idx = msg_lower.find(phrase) + len(phrase)
                topic = message[idx:].strip("?.!,")
                break
        matched_tool = "search_wikipedia"
        tool_input = topic
    elif any(k in msg_lower for k in ["run command", "execute", "cmd", "system"]):
        # Extract command
        cmd = message
        for phrase in ["run command", "execute cmd", "execute", "cmd"]:
            if phrase in msg_lower:
                idx = msg_lower.find(phrase) + len(phrase)
                cmd = message[idx:].strip(" '\"")
                break
        matched_tool = "run_command"
        tool_input = cmd
    
    # Check if tool is enabled
    if matched_tool and not active_tools.get(matched_tool, True):
        yield {"step": "plan", "content": f"The tool '{matched_tool}' is required, but it is currently disabled."}
        await asyncio.sleep(0.8)
        yield {"step": "output", "content": f"I need to use the '{matched_tool}' tool to answer your request, but it has been disabled in the settings. Please enable it and try again."}
        return
        
    if matched_tool:
        yield {"step": "plan", "content": f"Identified tool execution path: Need to call '{matched_tool}' with input '{tool_input}'."}
        await asyncio.sleep(0.8)
        yield {"step": "action", "function": matched_tool, "input": tool_input}
        await asyncio.sleep(0.5)
        
        # Execute tool
        start_time = time.time()
        try:
            output = available_tools[matched_tool](tool_input)
            status = "success"
        except Exception as e:
            output = f"Error executing tool: {str(e)}"
            status = "failure"
        duration = time.time() - start_time
        
        # Log to db
        db.log_execution(matched_tool, status, duration, tool_input, output)
        
        yield {"step": "observe", "output": output}
        await asyncio.sleep(1.0)
        
        # Generate final output
        final_answer = ""
        if matched_tool == "get_weather":
            final_answer = f"According to real-time data from wttr.in:\n\n{output}\n\nI hope this helps you plan your day!"
        elif matched_tool == "calculator":
            final_answer = f"I evaluated the mathematical expression and got the following result:\n\n**{output}**"
        elif matched_tool == "search_wikipedia":
            final_answer = f"I searched Wikipedia and retrieved the following summary:\n\n{output}"
        elif matched_tool == "run_command":
            final_answer = f"I executed the system command `{tool_input}`. Here is the console output:\n\n```bash\n{output}\n```"
            
        yield {"step": "output", "content": final_answer}
    else:
        # General response (mocking Wikipedia search fallback or generic thinking)
        yield {"step": "plan", "content": "This is a general query. I will search Wikipedia to find information."}
        await asyncio.sleep(0.8)
        yield {"step": "action", "function": "search_wikipedia", "input": message}
        await asyncio.sleep(0.5)
        
        start_time = time.time()
        output = search_wikipedia(message)
        duration = time.time() - start_time
        
        db.log_execution("search_wikipedia", "success", duration, message, output)
        
        yield {"step": "observe", "output": output}
        await asyncio.sleep(1.0)
        
        yield {"step": "output", "content": f"Here is what I found about your query:\n\n{output}"}

# Main Agent Runner (SSE Stream)
async def run_agent_loop(chat_id: str, message: str):
    db.increment_queries()
    settings = db.get_settings()
    active_tools = settings.get("tools", {})
    
    # 1. API key extraction
    api_key = settings.get("gemini_api_key", "").strip()
    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        # Fallback to the notebook key
        api_key = ""
        
    model = settings.get("model", "gemini-2.5-flash")
    
    # Create client
    is_mock = False
    try:
        # Basic check to see if key seems plausible, otherwise use mock
        if api_key == "MOCK_KEY" or not api_key:
            is_mock = True
        else:
            client = OpenAI(
                api_key=api_key,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
            )
    except Exception:
        is_mock = True

    steps_taken = []
    final_output = ""

    if is_mock:
        async for step in run_mock_agent(message, active_tools):
            steps_taken.append(step)
            if step["step"] == "output":
                final_output = step["content"]
            yield f"data: {json.dumps(step)}\n\n"
        
        # Save to DB
        db.add_message(chat_id, "user", message)
        db.add_message(chat_id, "assistant", final_output, steps_taken)
        return

    # Real Agent Loop
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": message}
    ]
    
    max_iterations = 10
    iteration = 0
    
    try:
        while iteration < max_iterations:
            iteration += 1
            
            # Request LLM step
            try:
                response = client.chat.completions.create(
                    model=model,
                    response_format={"type": "json_object"},
                    messages=messages,
                    temperature=settings.get("temperature", 0.2)
                )
            except Exception as e:
                # LLM request failed (e.g. quota, bad key), fallback to mock agent
                error_msg = f"LLM Connection failed ({str(e)}). Falling back to simulated reasoning engine."
                yield f"data: {json.dumps({'step': 'plan', 'content': error_msg})}\n\n"
                await asyncio.sleep(1.0)
                async for step in run_mock_agent(message, active_tools):
                    steps_taken.append(step)
                    if step["step"] == "output":
                        final_output = step["content"]
                    yield f"data: {json.dumps(step)}\n\n"
                db.add_message(chat_id, "user", message)
                db.add_message(chat_id, "assistant", final_output, steps_taken)
                return

            response_content = response.choices[0].message.content
            messages.append({"role": "assistant", "content": response_content})
            
            try:
                parsed = json.loads(response_content)
            except json.JSONDecodeError:
                yield f"data: {json.dumps({'step': 'plan', 'content': 'Failed to parse assistant response. Retrying...'})}\n\n"
                continue

            step_type = parsed.get("step")
            
            # Send step to client
            yield f"data: {json.dumps(parsed)}\n\n"
            steps_taken.append(parsed)
            
            if step_type == "plan":
                await asyncio.sleep(0.5) # tiny delay for readability in UI
                continue
                
            elif step_type == "action":
                tool_name = parsed.get("function")
                tool_input = parsed.get("input")
                
                # Check if tool is disabled
                if tool_name not in active_tools or not active_tools.get(tool_name, True):
                    observe_msg = f"Error: Tool '{tool_name}' is disabled in settings."
                    yield f"data: {json.dumps({'step': 'observe', 'output': observe_msg})}\n\n"
                    steps_taken.append({"step": "observe", "output": observe_msg})
                    messages.append({"role": "user", "content": json.dumps({"step": "observe", "output": observe_msg})})
                    continue
                
                if tool_name in available_tools:
                    # Run tool
                    start_time = time.time()
                    try:
                        output = available_tools[tool_name](tool_input)
                        status = "success"
                    except Exception as e:
                        output = f"Error: {str(e)}"
                        status = "failure"
                    duration = time.time() - start_time
                    
                    # Log execution
                    db.log_execution(tool_name, status, duration, str(tool_input), output)
                    
                    # Send observation to client
                    observe_step = {"step": "observe", "output": output}
                    yield f"data: {json.dumps(observe_step)}\n\n"
                    steps_taken.append(observe_step)
                    
                    # Feed observation back to LLM
                    messages.append({"role": "user", "content": json.dumps({"step": "observe", "output": output})})
                    await asyncio.sleep(0.5)
                else:
                    observe_msg = f"Error: Tool '{tool_name}' is not supported."
                    yield f"data: {json.dumps({'step': 'observe', 'output': observe_msg})}\n\n"
                    steps_taken.append({"step": "observe", "output": observe_msg})
                    messages.append({"role": "user", "content": json.dumps({"step": "observe", "output": observe_msg})})
                    
            elif step_type == "output":
                final_output = parsed.get("content", "")
                break
                
        if iteration >= max_iterations:
            final_output = "The agent execution exceeded maximum thinking steps limit."
            yield f"data: {json.dumps({'step': 'output', 'content': final_output})}\n\n"
            steps_taken.append({"step": "output", "content": final_output})

        # Save conversation to DB
        db.add_message(chat_id, "user", message)
        db.add_message(chat_id, "assistant", final_output, steps_taken)

    except Exception as e:
        error_msg = f"An unexpected error occurred during execution: {str(e)}"
        yield f"data: {json.dumps({'step': 'output', 'content': error_msg})}\n\n"
        steps_taken.append({"step": "output", "content": error_msg})
        db.add_message(chat_id, "user", message)
        db.add_message(chat_id, "assistant", error_msg, steps_taken)

@app.post("/api/chat")
async def chat(request: ChatRequest):
    chat_id = request.chat_id
    if not chat_id:
        new_chat = db.create_chat()
        chat_id = new_chat["id"]
        
    return StreamingResponse(
        run_agent_loop(chat_id, request.message),
        media_type="text/event-stream"
    )

@app.get("/api/history")
def get_history():
    return db.get_chats()

@app.post("/api/chat/create")
def create_chat_endpoint():
    return db.create_chat()

@app.delete("/api/history/{chat_id}")
def delete_chat(chat_id: str):
    success = db.delete_chat(chat_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {"status": "success", "message": "Conversation deleted"}

@app.post("/api/chat/clear")
def clear_chats():
    db.clear_all_chats()
    return {"status": "success", "message": "All conversations cleared"}

@app.get("/api/analytics")
def get_analytics():
    return db.get_analytics()

@app.get("/api/settings")
def get_settings():
    return db.get_settings()

@app.post("/api/settings")
def update_settings(settings: SettingsUpdate):
    # Convert Pydantic model to dict, filtering out None values
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    updated = db.update_settings(update_data)
    return updated

@app.get("/api/executions")
def get_executions():
    return db.get_executions()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
