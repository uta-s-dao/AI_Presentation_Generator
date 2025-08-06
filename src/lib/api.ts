// lib/api.ts
const API_BASE = "http://localhost:3001";

export interface DatabasePresentation {
  id: number;
  unique_id: string;
  title: string;
  company: string;
  creator: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl: string;
}

// データベースからプレゼンテーション一覧を取得
export async function fetchPresentationsFromDatabase(): Promise<
  DatabasePresentation[]
> {
  try {
    const response = await fetch(`${API_BASE}/api/presentations`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const presentations = await response.json();
    return presentations;
  } catch (error) {
    console.error("Failed to fetch presentations from database:", error);
    return [];
  }
}

// プレゼンテーションを保存
// プレゼンテーションを新規作成
export async function createPresentationInDatabase(data: {
  title: string;
  company: string;
  creator: string;
  content?: string;
  thumbnailUrl?: string;
}): Promise<{ success: boolean; unique_id?: string; message?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/presentations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to create presentation in database:", error);
    throw error; // nullを返すのではなくエラーを投げる
  }
}

// プレゼンテーションを削除
export async function deletePresentationFromDatabase(
  uniqueId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/presentations/${uniqueId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error("Failed to delete presentation from database:", error);
    return false;
  }
}

// プレゼンテーションを更新
export async function updatePresentationInDatabase(
  uniqueId: string,
  data: {
    title: string;
    company: string;
    creator: string;
    content: string;
  }
): Promise<DatabasePresentation | null> {
  try {
    const response = await fetch(`${API_BASE}/api/presentations/${uniqueId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to update presentation in database:", error);
    return null;
  }
}
