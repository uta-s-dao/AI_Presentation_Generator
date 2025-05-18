import React, { useState, useEffect } from 'react';
import { Presentation, Edit, Trash2, Calendar, User } from 'lucide-react';
import { getSavedPresentations, deletePresentation, SavedPresentation } from '../lib/storage';
import { escapeHtml } from '../lib/utils';

interface SavedPresentationsProps {
  onPresentationSelect: (presentation: SavedPresentation) => void;
  onCreateNew: () => void;
}

export function SavedPresentations({ onPresentationSelect, onCreateNew }: SavedPresentationsProps) {
  const [presentations, setPresentations] = useState<SavedPresentation[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('SavedPresentations component mounted');
    }
    loadPresentations();
  }, []);

  const loadPresentations = () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Loading presentations from storage');
    }
    const savedPresentations = getSavedPresentations();
    if (process.env.NODE_ENV !== 'production') {
      console.log('Retrieved presentations:', savedPresentations);
    }
    
    const sortedPresentations = savedPresentations.length > 0
      ? savedPresentations.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      : [];
      
    if (process.env.NODE_ENV !== 'production') {
      console.log('Setting presentations state:', sortedPresentations);
    }
    setPresentations(sortedPresentations);
  };

  const handleDelete = (id: string) => {
    setShowConfirmDelete(id);
  };

  const confirmDelete = (id: string) => {
    deletePresentation(id);
    loadPresentations();
    setShowConfirmDelete(null);
  };

  const cancelDelete = () => {
    setShowConfirmDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('SavedPresentations rendering, presentations.length:', presentations.length);
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Presentation className="w-10 h-10 text-blue-600" />
          <h1 className="text-2xl font-bold ml-3 text-gray-800">保存されたプレゼンテーション</h1>
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          新規作成
        </button>
      </div>

      {/* デバッグ情報 */}
      <div className="text-xs text-gray-500 mb-4">
        データ件数: {presentations.length}
      </div>

      {presentations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Presentation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">プレゼンテーションがありません</h3>
          <p className="text-gray-500 mb-6">新しいプレゼンテーションを作成してください</p>
          <button
            onClick={onCreateNew}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            プレゼンテーションを作成
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {presentations.map((presentation) => (
            <div 
              key={presentation.id}
              className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 relative"
            >
              {showConfirmDelete === presentation.id && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                  <div className="text-center p-6">
                    <p className="text-gray-800 mb-4">このプレゼンテーションを削除してもよろしいですか？</p>
                    <div className="flex space-x-3 justify-center">
                      <button
                        onClick={() => confirmDelete(presentation.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        削除する
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold text-gray-800 truncate">
                    {presentation.title}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {presentation.company}
                  </p>
                  
                  <div className="flex flex-wrap mt-3 text-xs text-gray-500 gap-3">
                    <div className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-1" />
                      {presentation.creator}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {formatDate(presentation.updatedAt)}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => onPresentationSelect(presentation)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="編集"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(presentation.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}