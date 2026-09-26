# Lexi

Lexi is an AI legal research assistant for Indian law. It uses a local Ollama model and Tavily web search to explain laws, analyze questions, suggest next steps, and provide sources.

## Run

Requirements: Python 3.12+, [Ollama](https://ollama.com/), and [uv](https://docs.astral.sh/uv/).

```bash
ollama pull qwen2.5:7b
uv sync
copy .example.env .env
```

Add your `TAVILY_API_KEY` to `.env`.

To easily start the whole project (frontend & backend) on Windows, simply double-click the `run.bat` file, or run it from the terminal:

```bash
.\run.bat
```

Alternatively, to start the CLI version of Lexi:

```bash
uv run python -m agent.main
```

Type your question in the terminal. Enter `q` to quit.

## API

Start the streaming backend:

```bash
uv run uvicorn backend.main:app --reload
```

Send a `POST` request to `http://localhost:8000/chat`:

```json
{"query": "What is a legal notice?"}
```

The response is an SSE stream. Listen for `token` events for the answer and `tool_start` / `tool_end` events to show web-search activity in the frontend.

## Frontend

The project includes a sleek, modern React frontend with real-time streaming support and animations.

To start the frontend, ensure you have [Bun](https://bun.sh/) installed:

```bash
cd frontend
bun install
bun run dev
```

The frontend will be available at `http://localhost:3000` (or the port specified by Bun). Ensure the backend is running simultaneously.

Lexi provides general research information and is not a substitute for advice from a qualified lawyer.
