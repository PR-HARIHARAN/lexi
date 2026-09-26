import json
from collections.abc import AsyncIterator
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent.main import agent


app = FastAPI(title="Lexi API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    query: str


def get_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict)
        )
    return ""


def sse_event(event_type: str, data: Any) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data, default=str)}\n\n"


async def stream_chat(query: str) -> AsyncIterator[str]:
    yield sse_event("status", {"message": "started"})

    try:
        async for event in agent.astream_events(
            {"messages": [{"role": "user", "content": query}]},
            version="v2",
        ):
            event_name = event["event"]
            data = event.get("data", {})

            if event_name == "on_chat_model_stream":
                text = get_text(getattr(data.get("chunk"), "content", ""))
                if text:
                    yield sse_event("token", {"content": text})
            elif event_name == "on_tool_start":
                yield sse_event(
                    "tool_start",
                    {"name": event.get("name"), "input": data.get("input")},
                )
            elif event_name == "on_tool_end":
                yield sse_event(
                    "tool_end",
                    {"name": event.get("name"), "output": data.get("output")},
                )

        yield sse_event("status", {"message": "completed"})
    except Exception as error:
        yield sse_event("error", {"message": str(error)})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    return StreamingResponse(
        stream_chat(request.query),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )