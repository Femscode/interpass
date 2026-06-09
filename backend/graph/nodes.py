"""
🎓 GRAPH NODES — graph/nodes.py

Each function in this file is a NODE in our LangGraph state machine.

A node function:
  - Takes the current InterviewState as its only argument
  - Does some work (calls LLM, updates data, etc.)
  - Returns a DICT with only the fields it wants to change

LangGraph then MERGES that dict into the existing state.
You never replace the whole state — only the fields you return.

Example:
  If current state is: {"question_count": 2, "company": "Google", ...}
  And a node returns:  {"question_count": 3}
  New state becomes:   {"question_count": 3, "company": "Google", ...}
  → Only question_count changed. Everything else is preserved.

THE NODES IN OUR GRAPH:
  1. initialize_interview  → sets up the session, generates the opening question
  2. ask_question          → sends the current question, increments counter
  3. await_answer          → INTERRUPTS the graph, waiting for user input
  4. process_answer        → evaluates the answer, decides what comes next
  5. generate_feedback     → creates the final evaluation report
"""

import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.types import interrupt

from graph.state import InterviewState
from prompts.system_prompts import (
    get_interviewer_system_prompt,
    get_question_generation_prompt,
    get_feedback_prompt,
)


def _get_llm() -> ChatOpenAI:
    """
    Creates our LLM client.
    We create it fresh each call — LangChain handles connection pooling.
    temperature=0.7: a little creativity, but not too random.
    """
    return ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        temperature=0.7,
        api_key=os.getenv("OPENAI_API_KEY"),
    )


# ─────────────────────────────────────────────────────────────────────────────
# NODE 1: initialize_interview
# ─────────────────────────────────────────────────────────────────────────────
def initialize_interview(state: InterviewState) -> dict:
    """
    The FIRST node in the graph. Runs once at the start of every session.

    What it does:
      1. Greets the candidate and sets the tone
      2. Generates the very first interview question
      3. Initialises progress counters

    Returns only the fields it changes — everything else (company, role, etc.)
    was already set when the graph was invoked.
    """
    llm = _get_llm()

    system_prompt = get_interviewer_system_prompt(state)

    # The opening message — sets a professional but welcoming tone
    opening_instruction = (
        f"Start the interview. Greet the candidate warmly, briefly introduce yourself "
        f"as an interviewer at {state['company']} for the {state['role']} position, "
        f"and ask your FIRST interview question. "
        f"Keep the greeting to 1-2 sentences, then ask the question."
    )

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=opening_instruction),
    ])

    opening_message = response.content

    return {
        "messages": [AIMessage(content=opening_message)],
        "current_question": opening_message,
        "question_count": 1,
        "is_complete": False,
        "feedback": "",
        "last_answer": "",
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 2: await_answer
# ─────────────────────────────────────────────────────────────────────────────
def await_answer(state: InterviewState) -> dict:
    """
    🎓 THE INTERRUPT NODE — the most important LangGraph concept in this project.

    interrupt() PAUSES the graph execution and saves the current state to storage.
    The graph is literally suspended mid-execution.

    When the user submits their answer:
      1. Our FastAPI endpoint calls graph.update_state() with the answer
      2. Then calls graph.stream() to RESUME from where we left off
      3. The interrupt() returns the value that was passed to update_state()

    This is how LangGraph enables "human-in-the-loop" patterns.
    Without this, the graph would just run to completion with no user input!

    Think of it like Python's `input()` — but for async, distributed, web apps.
    """
    # interrupt() suspends execution here. The graph will resume when
    # we call it again with the user's answer.
    user_answer = interrupt("Waiting for candidate response...")

    # When resumed, user_answer contains whatever was passed into the interrupt
    return {
        "messages": [HumanMessage(content=user_answer)],
        "last_answer": user_answer,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 3: process_answer
# ─────────────────────────────────────────────────────────────────────────────
def process_answer(state: InterviewState) -> dict:
    """
    Evaluates the candidate's answer and generates the next question.

    This node is where the AI acts as a real interviewer:
      - It reads the full conversation history
      - It generates a contextual follow-up or next question
      - It decides whether to continue or end the interview

    The DECISION of whether to continue or end is NOT made here —
    that's the job of the conditional edge (see interview_graph.py).
    This node just updates the state with the new question and increments the counter.
    """
    llm = _get_llm()

    new_count = state["question_count"] + 1
    is_done = new_count > state["max_questions"]

    if is_done:
        # No new question needed — the conditional edge will route to generate_feedback
        return {
            "question_count": new_count,
            "current_question": "",
        }

    # Generate the next question using full conversation context
    system_prompt = get_interviewer_system_prompt(state)
    next_q_prompt = get_question_generation_prompt(state)

    # We pass the FULL message history — the LLM sees the entire conversation
    # This is why the add_messages reducer matters: we're building up context
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        *state["messages"],          # full conversation history so far
        HumanMessage(content=next_q_prompt),
    ])

    next_question = response.content

    return {
        "messages": [AIMessage(content=next_question)],
        "current_question": next_question,
        "question_count": new_count,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 4: generate_feedback
# ─────────────────────────────────────────────────────────────────────────────
def generate_feedback(state: InterviewState) -> dict:
    """
    The FINAL node — runs once after all questions are answered.

    Generates a structured post-interview report by asking the LLM to
    evaluate the entire conversation history.

    This is an example of the "LLM-as-evaluator" pattern — using the same
    model that conducted the interview to also assess performance.
    In production you might use a separate, more analytical model for this.
    """
    llm = _get_llm()

    feedback_prompt = get_feedback_prompt(state)

    response = llm.invoke([
        SystemMessage(content=feedback_prompt),
        *state["messages"],  # full conversation — LLM evaluates everything
        HumanMessage(content="Please provide the structured feedback now."),
    ])

    farewell = (
        "Thank you for completing the interview session! "
        "Here is your detailed feedback:"
    )

    feedback_text = response.content

    return {
        "messages": [AIMessage(content=f"{farewell}\n\n{feedback_text}")],
        "feedback": feedback_text,
        "is_complete": True,
        "current_question": "",
    }


# ─────────────────────────────────────────────────────────────────────────────
# CONDITIONAL EDGE FUNCTION
# ─────────────────────────────────────────────────────────────────────────────
def should_continue_or_end(state: InterviewState) -> str:
    """
    🎓 CONDITIONAL EDGE

    This function is NOT a node — it's a router.
    LangGraph calls it after process_answer to decide which node comes next.

    Returns a string that matches one of the edges defined in the graph.
    The graph uses this string to pick the next node to execute.

    Think of it as a traffic light at an intersection:
      - "continue"  → go back to await_answer (ask another question)
      - "end"       → go to generate_feedback (wrap up)
    """
    if state["question_count"] > state["max_questions"]:
        return "end"
    return "continue"
