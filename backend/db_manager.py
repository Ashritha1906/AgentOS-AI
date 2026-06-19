import os
import json
import uuid
import time
from typing import Dict, List, Any

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DB_DIR, "data")
DB_FILE = os.path.join(DATA_DIR, "db.json")

DEFAULT_DB = {
    "chats": [],
    "settings": {
        "gemini_api_key": "",
        "model": "gemini-2.5-flash",
        "temperature": 0.2,
        "tools": {
            "get_weather": True,
            "calculator": True,
            "search_wikipedia": True,
            "run_command": True
        }
    },
    "executions": [],
    "analytics": {
        "total_queries": 0,
        "successful_executions": 0,
        "failed_executions": 0
    }
}

class DBManager:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(DB_FILE):
            self.save_db(DEFAULT_DB)

    def load_db(self) -> Dict[str, Any]:
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return DEFAULT_DB

    def save_db(self, db_data: Dict[str, Any]):
        try:
            with open(DB_FILE, "w") as f:
                json.dump(db_data, f, indent=2)
        except Exception as e:
            print(f"Error saving database: {e}")

    # CHAT METHODS
    def get_chats(self) -> List[Dict[str, Any]]:
        db = self.load_db()
        return db.get("chats", [])

    def get_chat(self, chat_id: str) -> Dict[str, Any]:
        chats = self.get_chats()
        for chat in chats:
            if chat["id"] == chat_id:
                return chat
        return None

    def create_chat(self, title: str = "New Conversation") -> Dict[str, Any]:
        db = self.load_db()
        new_chat = {
            "id": str(uuid.uuid4()),
            "title": title,
            "created_at": time.time(),
            "messages": []
        }
        db["chats"].insert(0, new_chat)
        self.save_db(db)
        return new_chat

    def add_message(self, chat_id: str, role: str, content: str, steps: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        db = self.load_db()
        new_msg = {
            "id": str(uuid.uuid4()),
            "role": role,
            "content": content,
            "steps": steps or [],
            "timestamp": time.time()
        }
        
        chat_found = False
        for chat in db["chats"]:
            if chat["id"] == chat_id:
                chat["messages"].append(new_msg)
                # Auto rename chat if it was the first user message
                if role == "user" and len(chat["messages"]) == 1:
                    # Limit title to 30 chars
                    chat["title"] = content[:30] + ("..." if len(content) > 30 else "")
                chat_found = True
                break
                
        if not chat_found:
            # Create a new chat if ID not found
            new_chat = {
                "id": chat_id,
                "title": content[:30] + ("..." if len(content) > 30 else "") if role == "user" else "New Conversation",
                "created_at": time.time(),
                "messages": [new_msg]
            }
            db["chats"].insert(0, new_chat)

        self.save_db(db)
        return new_msg

    def delete_chat(self, chat_id: str) -> bool:
        db = self.load_db()
        initial_len = len(db["chats"])
        db["chats"] = [c for c in db["chats"] if c["id"] != chat_id]
        self.save_db(db)
        return len(db["chats"]) < initial_len

    def clear_all_chats(self):
        db = self.load_db()
        db["chats"] = []
        self.save_db(db)

    # SETTINGS METHODS
    def get_settings(self) -> Dict[str, Any]:
        db = self.load_db()
        return db.get("settings", DEFAULT_DB["settings"])

    def update_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        db = self.load_db()
        # Merge settings
        for k, v in settings.items():
            if k == "tools" and isinstance(v, dict):
                db["settings"]["tools"].update(v)
            else:
                db["settings"][k] = v
        self.save_db(db)
        return db["settings"]

    # EXECUTIONS & ANALYTICS METHODS
    def log_execution(self, tool_name: str, status: str, duration: float, tool_input: str, tool_output: str):
        db = self.load_db()
        execution = {
            "id": str(uuid.uuid4()),
            "tool": tool_name,
            "status": status,
            "duration": duration,
            "input": tool_input,
            "output": tool_output,
            "timestamp": time.time()
        }
        db["executions"].insert(0, execution)
        
        # Limit execution logs to latest 100
        if len(db["executions"]) > 100:
            db["executions"] = db["executions"][:100]
            
        # Update analytics totals
        analytics = db.get("analytics", DEFAULT_DB["analytics"])
        if status == "success":
            analytics["successful_executions"] = analytics.get("successful_executions", 0) + 1
        else:
            analytics["failed_executions"] = analytics.get("failed_executions", 0) + 1
        db["analytics"] = analytics
        
        self.save_db(db)
        return execution

    def increment_queries(self):
        db = self.load_db()
        analytics = db.get("analytics", DEFAULT_DB["analytics"])
        analytics["total_queries"] = analytics.get("total_queries", 0) + 1
        db["analytics"] = analytics
        self.save_db(db)

    def get_executions(self) -> List[Dict[str, Any]]:
        db = self.load_db()
        return db.get("executions", [])

    def get_analytics(self) -> Dict[str, Any]:
        db = self.load_db()
        executions = db.get("executions", [])
        analytics = db.get("analytics", DEFAULT_DB["analytics"])
        
        # Calculate stats dynamically
        total_executions = len(executions)
        tool_counts = {}
        success_count = 0
        failure_count = 0
        total_duration = 0.0
        
        for exe in executions:
            tool = exe["tool"]
            tool_counts[tool] = tool_counts.get(tool, 0) + 1
            if exe["status"] == "success":
                success_count += 1
            else:
                failure_count += 1
            total_duration += exe["duration"]

        avg_duration = total_duration / total_executions if total_executions > 0 else 0.0
        most_used = max(tool_counts, key=tool_counts.get) if tool_counts else "None"
        
        # Return merged dict
        return {
            "total_queries": analytics.get("total_queries", 0),
            "total_executions": total_executions,
            "successful_executions": success_count,
            "failed_executions": failure_count,
            "average_response_time": round(avg_duration, 2),
            "most_used_tool": most_used,
            "tool_usage": tool_counts,
            "recent_executions": executions[:10]
        }
