import { chatbotPrompt } from "@/helpers/constants/chatbot-prompt";
import { AIBotStream, AIBotStreamPayload, AIMessage } from "@/lib/ai-stream";
import { MessageArraySchema } from "@/lib/validators/message";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const parsedMessages = MessageArraySchema.parse(messages);

  const outBoundMessages: AIMessage[] = parsedMessages.map((message) => ({
    role: message.isUserMessage ? "user" : "system",
    content: message.text,
  }));

  outBoundMessages.unshift({
    role: "system",
    content: chatbotPrompt,
  });

  const payload: AIBotStreamPayload = {
    model: "nvidia-llama3", //change this
    messages: outBoundMessages,
    temperature: 0.4,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 150,
    stream: true,
    n: 1,
  };

  const stream = await AIBotStream(payload);

  console.log(stream)

  return new Response(stream);
}
