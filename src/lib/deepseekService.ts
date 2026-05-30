import { loadDeepSeekConfig } from "./storage";

export async function callDeepSeek(
  messages: { role: "system" | "user"; content: string }[],
  stream = false,
  onToken?: (token: string) => void
): Promise<string> {
  const config = loadDeepSeekConfig();
  if (!config || !config.apiKey) {
    throw new Error("请先在系统设置中配置 DeepSeek API 密钥");
  }

  const url = `${config.baseUrl}/v1/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: 0.7,
      stream,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `API 错误 (${response.status})`;
    try {
      const err = JSON.parse(errorText);
      errorMsg = err.error?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  if (stream && onToken) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const jsonStr = line.slice(6);
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const token = parsed.choices?.[0]?.delta?.content || "";
          if (token) {
            fullText += token;
            onToken(token);
          }
        } catch {}
      }
    }
    return fullText;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/** Simple test: send a ping message to verify API works */
export async function testDeepSeekConnection(): Promise<string> {
  return callDeepSeek([
    { role: "user", content: "你好，请回复'连接成功'两个字，不要回复其他内容。" },
  ]);
}
