export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function postJSON<T>(url: string, data: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function chatCompletion(messages: ChatMessage[], model = 'gpt-4-turbo-preview', temperature = 0.7): Promise<string> {
  const data = await postJSON<{ text: string }>('/api/generate-text', { messages, model, temperature });
  return data.text;
}

export const generateNarration = async (slideContent: string): Promise<string> => {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'あなたはプロのプレゼンターです。スライドの内容に基づいた簡潔で魅力的なナレーションを生成してください。ナレーションは明確で自然な話し言葉で、1〜3文程度にしてください。'
    },
    {
      role: 'user',
      content: `以下のスライドのナレーションを生成してください:\n\n${slideContent}`
    }
  ];

  try {
    return await chatCompletion(messages, 'gpt-4');
  } catch (error) {
    console.error('ナレーション生成エラー:', error);
    return 'ナレーションの生成中にエラーが発生しました。';
  }
};