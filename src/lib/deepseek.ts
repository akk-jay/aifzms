interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class DeepSeekClient {
  private config: DeepSeekConfig;

  constructor(config: DeepSeekConfig) {
    this.config = config;
  }

  async generateAnswerStream(
    question: string,
    onToken: (token: string) => void,
    context?: {
      position?: string;
      language?: string;
      resume?: string;
    }
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ];

    const url = `${this.config.baseUrl}/v1/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

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
        } catch {
          // Skip parse errors
        }
      }
    }

    return fullText;
  }

  private buildSystemPrompt(
    context?: {
      position?: string;
      language?: string;
      resume?: string;
    }
  ): string {
    let prompt = "你是一位专业的面试助手，帮助应聘者在面试中提供回答建议。";

    if (context?.position) {
      prompt += `面试岗位：${context.position}。`;
    }

    if (context?.language) {
      prompt += `主要编程语言：${context.language}。`;
    }

    prompt += `请遵循以下规则：
1. 回答简洁、专业、有结构（要点式）
2. 结合岗位特点给出针对性回答
3. 使用中文回答（除非面试官使用英文提问）
4. 控制在200-300字以内，便于快速阅读
5. 使用 STAR 法则（情境、任务、行动、结果）组织项目经验类回答`;

    if (context?.resume) {
      prompt += `\n\n应聘者简历信息：${context.resume}`;
    }

    return prompt;
  }
}
