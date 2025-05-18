import React from 'react';
import { Presentation as PresentationScreen, Loader2 } from 'lucide-react';

interface FormData {
  title: string;
  company: string;
  creator: string;
  overview: string;
  purpose: string;
  slideCount: number;
}

interface InitialFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

export function InitialForm({ onSubmit, isLoading }: InitialFormProps) {
  const [formData, setFormData] = React.useState<FormData>({
    title: '',
    company: '',
    creator: '',
    overview: '',
    purpose: '',
    slideCount: 5,
  });
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プレゼンテーションの生成中にエラーが発生しました');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center justify-center mb-8">
        <PresentationScreen className="w-12 h-12 text-blue-600" />
        <h1 className="text-3xl font-bold ml-3 text-gray-800">AIプレゼンテーション生成</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            プレゼンテーションのタイトル
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isLoading}
            placeholder="タイトルを入力してください"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              会社名
            </label>
            <input
              type="text"
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
              placeholder="会社名を入力してください"
            />
          </div>

          <div>
            <label htmlFor="creator" className="block text-sm font-medium text-gray-700 mb-1">
              作成者名
            </label>
            <input
              type="text"
              id="creator"
              value={formData.creator}
              onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
              placeholder="作成者名を入力してください"
            />
          </div>
        </div>

        <div>
          <label htmlFor="overview" className="block text-sm font-medium text-gray-700 mb-1">
            概要
          </label>
          <textarea
            id="overview"
            value={formData.overview}
            onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
            required
            disabled={isLoading}
            placeholder="プレゼンテーションの概要を入力してください"
          />
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
            目的
          </label>
          <textarea
            id="purpose"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
            required
            disabled={isLoading}
            placeholder="プレゼンテーションの目的を入力してください"
          />
        </div>

        <div>
          <label htmlFor="slideCount" className="block text-sm font-medium text-gray-700 mb-1">
            スライド枚数
          </label>
          <input
            type="number"
            id="slideCount"
            min="1"
            max="50"
            value={formData.slideCount}
            onChange={(e) =>
              setFormData({
                ...formData,
                slideCount: parseInt(e.target.value, 10),
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              プレゼンテーションを生成中...
            </>
          ) : (
            'プレゼンテーションを生成'
          )}
        </button>
      </form>
    </div>
  );
}