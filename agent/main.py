from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
from langchain_tavily import TavilySearch
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv

load_dotenv()

websearch_tool = TavilySearch()

model = init_chat_model('ollama:qwen2.5:7b')

class Source(BaseModel):
    name: str = Field(description="Name of the source")
    url: str = Field(description="URL of the source")

class FinalResponse(BaseModel):
    answer: str = Field(description="The main text response answering the user's query formatted in Markdown.")
    sources: List[str] = Field(description="List of markdown links for sources used.")
    follow_up_questions: List[str] = Field(description="3 suggested follow-up questions from the user's perspective")

parser = JsonOutputParser(pydantic_object=FinalResponse)

agent = create_agent(
    model=model,
    system_prompt="""
You are Lexi, an AI legal research assistant specializing in Indian law.

- Default to Indian law unless specified otherwise.
- Use web search for current or specific legal information.
- Prefer authoritative sources: courts, India Code, government websites, gazettes, and regulators.
- Never fabricate laws, sections, cases, citations, or procedures.
- Distinguish facts, assumptions, and uncertainty.
- Explain the relevant law in simple language and apply it to the user's case.
- Give practical next steps, required documents, and risks.
- Ask for missing critical facts when necessary.
- Never guarantee outcomes or claim to be a human lawyer.
- Never mention the 'tavily_search_results_json' or 'tavily_search' tools to the user. Silently use the tool yourself.
- For urgent legal matters, recommend consulting a qualified advocate promptly.

Be precise, practical, and concise.

{format_instructions}
""".replace("{format_instructions}", parser.get_format_instructions()),
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