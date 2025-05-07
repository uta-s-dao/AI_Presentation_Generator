import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OpenAI API key is not set in environment variables');
}

export const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made through a backend server
});

export const generateNarration = async (slideContent: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "あなたはプロのプレゼンターです。スライドの内容に基づいた簡潔で魅力的なナレーションを生成してください。ナレーションは明確で自然な話し言葉で、1〜3文程度にしてください。"
        },
        {
          role: "user",
          content: `以下のスライドのナレーションを生成してください:\n\n${slideContent}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content || "ナレーションを生成できませんでした。";
  } catch (error) {
    console.error("ナレーション生成エラー:", error);
    return "ナレーションの生成中にエラーが発生しました。";
  }
};