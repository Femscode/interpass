"""
🎓 LANGGRAPH STATE — graph/state.py

The State is the single most important concept in LangGraph.
Think of it as the "memory" that flows through the entire graph.

Every node function:
  - RECEIVES the current state as input
  - RETURNS a dictionary with fields to UPDATE in the state

LangGraph merges the returned dict into the existing state using "reducers".
The default reducer just overwrites the field with the new value.
The special `Annotated[list, add_messages]` reducer APPENDS to the list
instead of overwriting — perfect for a conversation history.

Why TypedDict?
  TypedDict gives us type safety without the overhead of a full class.
  It's like a regular dict but with type hints — Python knows what keys
  are valid and what type each value should be.
"""

from typing import TypedDict, Annotated, Literal
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage


class InterviewState(TypedDict):
    """
    The complete state of one interview session.
    Every node in the graph reads from and writes to this state.

    Fields:
        messages:        Full conversation history (AI questions + user answers).
                         Uses add_messages reducer → each update APPENDS, not overwrites.

        session_id:      The SQLite session UUID — ties graph state to our DB.

        company:         Target company (e.g. "Google")
        role:            Target role (e.g. "Senior Software Engineer")
        level:           Experience level ("junior" | "mid" | "senior" | "staff")
        interview_type:  Type of interview ("technical" | "behavioral" | "hr" | "system_design")

        question_count:  How many questions have been asked so far.
        max_questions:   Total questions to ask before ending (configurable).

        current_question: The question currently being asked (for the frontend to display).
        last_answer:      The user's most recent answer (set externally via graph.update_state).

        is_complete:     Whether the interview has ended.
        feedback:        Final feedback generated after the interview ends.
    """

    # --- Conversation history ---
    # Annotated[..., add_messages] tells LangGraph to use the add_messages
    # reducer: when a node returns {"messages": [new_msg]}, it APPENDS to
    # the existing list rather than replacing it.
    messages: Annotated[list[BaseMessage], add_messages]

    # --- Session metadata ---
    session_id: str
    company: str
    role: str
    level: str
    interview_type: str

    # --- Interview progress ---
    question_count: int
    max_questions: int

    # --- Turn-level data ---
    current_question: str
    last_answer: str

    # --- Terminal state ---
    is_complete: bool
    feedback: str
