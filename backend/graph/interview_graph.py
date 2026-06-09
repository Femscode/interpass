"""
🎓 INTERVIEW GRAPH — graph/interview_graph.py

This is where we WIRE the nodes together into a graph.
Think of it as the architectural blueprint — we define:
  - Which nodes exist
  - How they connect (edges)
  - Where the graph starts and ends
  - Which edges are conditional (branching)

The StateGraph class is the core of LangGraph.
We give it our InterviewState TypedDict, and it knows how to
manage state transitions as the graph executes.

VISUAL MAP OF OUR GRAPH:

  START
    │
    ▼
  [initialize_interview]   ← generates opening greeting + first question
    │
    ▼
  [await_answer]           ← INTERRUPT: waits for user input
    │
    ▼
  [process_answer]         ← evaluates answer, generates next question
    │
    ├─── "continue" ──────→ [await_answer]   (loop back)
    │
    └─── "end" ───────────→ [generate_feedback]
                                  │
                                  ▼
                               END

The "continue"/"end" branching is the CONDITIONAL EDGE.
"""

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from graph.state import InterviewState
from graph.nodes import (
    initialize_interview,
    await_answer,
    process_answer,
    generate_feedback,
    should_continue_or_end,
)


def build_interview_graph():
    """
    Constructs and compiles the interview graph.

    Returns a compiled graph object that can be:
      - .invoke()'d to run synchronously
      - .stream()'d to get updates as they happen (we'll use this for streaming)
      - .update_state()'d to inject external data (user answers)

    The MemorySaver checkpointer is what makes interrupt() work.
    Every time a node runs, MemorySaver saves the complete state to memory.
    When we resume after an interrupt, it loads the state back.

    🎓 In production you'd use a persistent checkpointer (e.g. SqliteSaver,
    PostgresSaver) so state survives server restarts. For our learning project,
    MemorySaver (in-memory dict) is perfect.
    """

    # Step 1: Create the graph builder with our state schema
    builder = StateGraph(InterviewState)

    # ─────────────────────────────────────────────────────────────────────────
    # Step 2: Add nodes
    # The first argument is the node's NAME (used in edges and for debugging)
    # The second argument is the FUNCTION to call when this node executes
    # ─────────────────────────────────────────────────────────────────────────
    builder.add_node("initialize_interview", initialize_interview)
    builder.add_node("await_answer", await_answer)
    builder.add_node("process_answer", process_answer)
    builder.add_node("generate_feedback", generate_feedback)

    # ─────────────────────────────────────────────────────────────────────────
    # Step 3: Add edges
    # Edges define the FLOW between nodes.
    # add_edge(A, B) means "after A runs, always go to B"
    # ─────────────────────────────────────────────────────────────────────────

    # START → initialize_interview (the graph's entry point)
    builder.add_edge(START, "initialize_interview")

    # After initializing, immediately wait for the first answer
    builder.add_edge("initialize_interview", "await_answer")

    # After getting an answer, process it
    builder.add_edge("await_answer", "process_answer")

    # After processing, BRANCH: continue interviewing or end?
    # add_conditional_edges takes:
    #   - The source node
    #   - The routing function (returns a string)
    #   - A mapping of return values → destination nodes
    builder.add_conditional_edges(
        "process_answer",
        should_continue_or_end,
        {
            "continue": "await_answer",       # loop back for next question
            "end": "generate_feedback",       # wrap up
        }
    )

    # After generating feedback, the graph is done
    builder.add_edge("generate_feedback", END)

    # ─────────────────────────────────────────────────────────────────────────
    # Step 4: Compile with a checkpointer
    # The checkpointer is what enables interrupt() to work.
    # Without it, the graph would have no memory between calls.
    # ─────────────────────────────────────────────────────────────────────────
    checkpointer = MemorySaver()
    graph = builder.compile(checkpointer=checkpointer)

    return graph


# Module-level singleton — one graph instance shared across all requests
# The graph itself is stateless; state is stored in the checkpointer per thread_id
interview_graph = build_interview_graph()
