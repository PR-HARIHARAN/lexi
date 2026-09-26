# Lexi

Lexi is an AI legal research assistant for Indian law. It uses a local Ollama model and Tavily web search to explain laws, analyze questions, suggest next steps, and provide sources.

## Run

Requirements: Python 3.12+, [Ollama](https://ollama.com/), and [uv](https://docs.astral.sh/uv/).

```bash
ollama pull qwen2.5:7b
uv sync
copy .example.env .env
```

Add your `TAVILY_API_KEY` to `.env`, then start Lexi:

```bash
uv run python -m agent.main
```

Type your question in the terminal. Enter `q` to quit.

Lexi provides general research information and is not a substitute for advice from a qualified lawyer.
