export interface SavedPresentation {
  id: string;
  title: string;
  company: string;
  creator: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

const STORAGE_KEY = "ai-presentations";

export function savePresentation(
  presentation: Omit<SavedPresentation, "id" | "createdAt" | "updatedAt">
): SavedPresentation {
  const savedPresentations = getSavedPresentations();

  const newPresentation: SavedPresentation = {
    ...presentation,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  savedPresentations.push(newPresentation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPresentations));

  return newPresentation;
}

export function updatePresentation(
  id: string,
  updates: Partial<Omit<SavedPresentation, "id" | "createdAt">>
): SavedPresentation | null {
  const savedPresentations = getSavedPresentations();
  const index = savedPresentations.findIndex((p) => p.id === id);

  if (index === -1) {
    return null;
  }

  const updatedPresentation = {
    ...savedPresentations[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  savedPresentations[index] = updatedPresentation;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPresentations));

  return updatedPresentation;
}

export function deletePresentation(id: string): boolean {
  const savedPresentations = getSavedPresentations();
  const filteredPresentations = savedPresentations.filter((p) => p.id !== id);

  if (filteredPresentations.length === savedPresentations.length) {
    return false;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPresentations));
  return true;
}

//localstorageから読み込み
export function getSavedPresentations(): SavedPresentation[] {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    const parsed = JSON.parse(data);

    // 配列でない場合は空の配列を返す（型安全）
    if (!Array.isArray(parsed)) {
      console.error("Saved presentations is not an array");
      return [];
    }

    // 各項目のバリデーション
    return parsed.filter((item): item is SavedPresentation => {
      // 必須フィールドのチェック
      const hasRequiredFields =
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.company === "string" &&
        typeof item.creator === "string" &&
        typeof item.content === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.updatedAt === "string";

      if (!hasRequiredFields) {
        console.error("Invalid presentation item:", item);
        return false;
      }

      return true;
    });
  } catch (error) {
    console.error("Error parsing saved presentations:", error);
    return [];
  }
}

export function getPresentationById(id: string): SavedPresentation | null {
  const savedPresentations = getSavedPresentations();
  return savedPresentations.find((p) => p.id === id) || null;
}

// デモ用のテストデータを追加する関数
export function addDemoPresentation() {
  // すでにデータがある場合は追加しない
  const existingPresentations = getSavedPresentations();
  if (existingPresentations.length > 0) {
    return;
  }

  const demoPresentation: Omit<
    SavedPresentation,
    "id" | "createdAt" | "updatedAt"
  > = {
    title: "サンプルプレゼンテーション",
    company: "デモ株式会社",
    creator: "システム",
    content: `# サンプルプレゼンテーション
## デモ株式会社
## システム

# AIを活用したビジネス革命
- 人工知能（AI）の急速な発展
- ビジネスプロセスの自動化と効率化
- データ分析による意思決定の改善
- 顧客体験の向上とパーソナライゼーション

# 主要なAI技術とその応用
- 機械学習とディープラーニング
- 自然言語処理（NLP）
- コンピュータビジョン
- 予測分析と意思決定支援

# 当社の取り組み
- AI導入の現状と成果
- 今後の展開と戦略
- 人材育成とスキル開発
- パートナーシップと協業

# 課題と展望
- 技術的課題と対策
- 倫理的配慮とガバナンス
- 市場動向と競合分析
- 中長期的なビジョン`,
  };

  savePresentation(demoPresentation);
  if (process.env.NODE_ENV !== "production") {
    console.log("Demo presentation added");
  }
}
