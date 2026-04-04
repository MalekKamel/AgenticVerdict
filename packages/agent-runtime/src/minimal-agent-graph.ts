import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";

/**
 * Single-node LangGraph that runs a chat model on the inbound messages — representative
 * of Phase 2 “agent” execution for LangSmith traces and integration tests.
 */
export async function invokeMinimalMessageGraph(
  model: BaseChatModel,
  userText: string,
  config?: RunnableConfig,
): Promise<string> {
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("chat", async (state) => {
      const response = await model.invoke(state.messages, config);
      return { messages: [response] };
    })
    .addEdge(START, "chat")
    .addEdge("chat", END);

  const app = graph.compile();
  const result = await app.invoke({ messages: [new HumanMessage(userText)] }, config);
  const last = result.messages.at(-1);
  const content = last?.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "object" && part !== null && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join("");
  }
  return "";
}
