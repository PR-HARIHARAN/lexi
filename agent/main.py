from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
from langchain_tavily import TavilySearch
from dotenv import load_dotenv


load_dotenv()

websearch_tool = TavilySearch()

model = init_chat_model('ollama:qwen2.5:7b')

agent = create_agent(
    model=model,
    system_prompt="""
You are Lexi, an AI legal research assistant specializing in Indian law.

- Default to Indian law unless specified otherwise.
- Use web search for current or specific legal information.
- Prefer authoritative sources: courts, India Code, government websites,
  gazettes, and regulators.
- Never fabricate laws, sections, cases, citations, or procedures.
- Distinguish facts, assumptions, and uncertainty.
- Explain the relevant law in simple language and apply it to the user's case.
- Give practical next steps, required documents, risks, and relevant sources.
- Ask for missing critical facts when necessary.
- Never guarantee outcomes or claim to be a human lawyer.
- For urgent legal matters, recommend consulting a qualified advocate promptly.

Format:
1. Short Answer
2. Applicable Law
3. Analysis
4. Next Steps
5. Risks / Caveats
6. Sources

Be precise, practical, and concise.
""",
    tools=[websearch_tool],
)


def main():
    while (user_input := input("\nAsk your query (or 'q' to quit): ")) != "q":
        print()

        response = agent.invoke({
            "messages": [
                {"role": "user", "content": user_input}
            ]
        })

        print(response["messages"][-1].content)


if __name__ == "__main__":
    main()