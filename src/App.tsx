import { useState, useEffect } from "react";
import { InitialForm } from "./components/InitialForm";
import { PresentationEditor } from "./components/PresentationEditor";
import { SavedPresentations } from "./components/SavedPresentations";
import { chatCompletion } from "./lib/openai";
import // savePresentation,
// updatePresentation,
// SavedPresentation,
// getSavedPresentations,
"./lib/storage";
import {
  DatabasePresentation,
  updatePresentationInDatabase,
  createPresentationInDatabase,
} from "./lib/api";

function App() {
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSavedPresentations, setShowSavedPresentations] =
    useState<boolean>(true);
  const [currentPresentation, setCurrentPresentation] = useState<{
    unique_id?: string;
    title: string;
    company: string;
    creator: string;
  }>({
    title: "",
    company: "",
    creator: "",
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // 保存メッセージを一定時間後に消す
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleFormSubmit = async (data: {
    title: string;
    company: string;
    creator: string;
    overview: string;
    purpose: string;
    slideCount: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const content = await chatCompletion(
        [
          {
            role: "system",
            content: `You are a professional presentation creator. Your task is to create a presentation outline with EXACTLY ${data.slideCount} slides, no more and no less. Follow these rules strictly:
1. Create EXACTLY ${data.slideCount} distinct slides
2. Each slide must be separated by TWO newlines
3. Use this format:
   - First slide MUST contain:
     # ${data.title}
     ## ${data.company}
     ## ${data.creator}
   - Other slides:
     # [Slide Title]
     [Content with bullet points using "-"]
4. Include bullet points with "-" where appropriate
5. Make each slide substantive and meaningful
6. Count your slides carefully and ensure it matches ${data.slideCount}
7. DO NOT include any extra slides
8. DO NOT include any transition text or notes between slides`,
          },
          {
            role: "user",
            content: `Create a presentation outline with exactly ${data.slideCount} slides.\nTitle: ${data.title}\nCompany: ${data.company}\nCreator: ${data.creator}\nOverview: ${data.overview}\nPurpose: ${data.purpose}\n\nIMPORTANT: The presentation MUST have EXACTLY ${data.slideCount} slides, no more and no less.`,
          },
        ],
        "gpt-4-turbo-preview",
        0.7
      );
      if (content) {
        // Split content into slides and ensure exact count
        const slides = content
          .split(/\n\n+/)
          .filter((slide) => slide.trim() !== "" && slide.trim() !== "---");

        if (slides.length < data.slideCount) {
          throw new Error(
            `AI generated only ${slides.length} slides instead of the requested ${data.slideCount} slides. Please try again.`
          );
        }

        // Take exactly the number of slides requested
        const finalSlides = slides.slice(0, data.slideCount);
        const formattedContent = finalSlides.join("\n\n");

        setGeneratedContent(formattedContent);
        setCurrentPresentation({
          title: data.title,
          company: data.company,
          creator: data.creator,
        });
        setIsEditing(true);
        setShowSavedPresentations(false);
      } else {
        throw new Error("No content generated");
      }
    } catch (error) {
      console.error("Error generating presentation:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate presentation. Please try again."
      );
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentSave = (newContent: string) => {
    setGeneratedContent(newContent);
  };

  const handlePresentationSave = async () => {
    if (!generatedContent) return;

    try {
      if (currentPresentation.unique_id) {
        // 既存のプレゼンテーションを更新
        updatePresentationInDatabase(currentPresentation.unique_id, {
          title: currentPresentation.title,
          company: currentPresentation.company,
          creator: currentPresentation.creator,
          content: generatedContent,
        });
        setSuccessMessage("プレゼンテーションを更新しました");
      } else {
        // 新しいプレゼンテーションを保存
        const saved = await createPresentationInDatabase({
          title: currentPresentation.title,
          company: currentPresentation.company,
          creator: currentPresentation.creator,
          content: generatedContent,
        });
        setCurrentPresentation((prev) => ({
          ...prev,
          unique_id: saved.unique_id,
        }));
        setSuccessMessage("プレゼンテーションを保存しました");
      }
      // プレゼンテーション一覧の更新をトリガー
      setNeedsRefresh(true);
    } catch (error) {
      console.error("Error saving presentation:", error);
      setError("プレゼンテーションの保存に失敗しました");
    }
  };

  const handleBack = () => {
    setIsEditing(false);
    setGeneratedContent(null);
    setCurrentPresentation({
      title: "",
      company: "",
      creator: "",
    });
    setShowSavedPresentations(true);
    // プレゼンテーション一覧の更新をトリガー
    setNeedsRefresh(true);
  };

  const handlePresentationSelect = (presentation: DatabasePresentation) => {
    setCurrentPresentation({
      unique_id: presentation.unique_id,
      title: presentation.title,
      company: presentation.company,
      creator: presentation.creator,
    });
    setGeneratedContent(presentation.content);
    setIsEditing(true);
    setShowSavedPresentations(false);
  };

  const handleCreateNew = () => {
    setShowSavedPresentations(false);
    setCurrentPresentation({
      title: "",
      company: "",
      creator: "",
    });
  };

  return (
    <div className='min-h-screen'>
      <div className='flex justify-center border-b mb-3'>
        {/* デバッグ情報 */}
        <button
          onClick={handleBack}
          className='pt-3 bg-blue-200 pr-3 pl-2 mb-2 text-4xl'
        >
          Presentation Generator
        </button>
      </div>
      {showSavedPresentations ? (
        // 保存されたプレゼンテーション一覧画面
        <SavedPresentations
          onPresentationSelect={handlePresentationSelect} //既存のプレゼンテーションが選択された時の処理
          onCreateNew={handleCreateNew} //新規プレゼンテーション作成時の処理：
          needsRefresh={needsRefresh}
          onRefreshComplete={() => setNeedsRefresh(false)}
        />
      ) : !isEditing ? (
        // プレゼンテーション作成フォーム画面
        <div className='flex items-center justify-center'>
          <InitialForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        </div>
      ) : generatedContent ? (
        // プレゼンテーション編集画面
        <div className='container mx-auto'>
          <div className='flex justify-between items-center mb-4'>
            <button
              onClick={handleBack}
              className='px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors'
            >
              ← 保存一覧に戻る
            </button>
            <div className='text-center flex-grow'>
              {currentPresentation.unique_id ? (
                <span className='text-sm text-gray-500'>
                  ID: {currentPresentation.unique_id}
                </span>
              ) : (
                <span className='text-sm text-gray-500'>
                  未保存のプレゼンテーション
                </span>
              )}
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              編集を終了
            </button>
          </div>
          <PresentationEditor
            content={generatedContent}
            title={currentPresentation.title}
            company={currentPresentation.company}
            creator={currentPresentation.creator}
            onSave={handleContentSave}
            onSavePresentation={handlePresentationSave}
          />
        </div>
      ) : null}

      {error && (
        <div className='fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {successMessage && (
        <div className='fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded'>
          {successMessage}
        </div>
      )}
    </div>
  );
}

export default App;
