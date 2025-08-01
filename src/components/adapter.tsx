import { getPresentationById, getLatestPresentationId } from "../lib/storage";
const API_BASE_URL = "http://localhost:3000";

export const createPresentationFromStorage = async (presentationId: string) => {
  try {
    // localStorageから特定のプレゼンテーションを取得
    const presentationData = getPresentationById(presentationId);

    if (!presentationData) {
      throw new Error(
        `Presentation with ID ${presentationId} not found in localStorage`
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/presentations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unique_id: presentationData.id,
        title: presentationData.title,
        company: presentationData.company,
        creator: presentationData.creator,
        content: presentationData.content,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("作成成功:", data);
      return data; // 作成されたデータを返す
    } else {
      const errorData = await response.json();
      console.error("エラー:", response.status, errorData);
      throw new Error(
        `HTTP ${response.status}: ${errorData.error || "Unknown error"}`
      );
    }
  } catch (error) {
    console.error("ネットワークエラー:", error);
    throw error; // エラーを再スローして呼び出し元で処理できるようにする
  }
};

export const saveLatestPresentationToDatabase = async () => {
  const latestId = getLatestPresentationId();
  if (!latestId) {
    throw new Error("No presentations found in localStorage");
  }

  return await createPresentationFromStorage(latestId);
};
