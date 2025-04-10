import React, { useEffect, useRef, useState } from 'react';
import Reveal from 'reveal.js';
import { Maximize2, Minimize2, ImagePlus, FileDown } from 'lucide-react';
import { openai } from '../lib/openai';
import { imageQueue } from '../lib/imageQueue';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/white.css';

interface PresentationEditorProps {
  content: string;
  onSave: (content: string) => void;
}

interface GeneratedImage {
  id: string;
  url: string;
  alt: string;
}

export function PresentationEditor({ content, onSave }: PresentationEditorProps) {
  const presentationRef = useRef<HTMLDivElement>(null);
  const deck = useRef<Reveal.Api | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const currentSlideRef = useRef<{ h: number; v: number; f: number | undefined }>({ h: 0, v: 0, f: undefined });
  const contentRef = useRef(content);

  const generateImages = async () => {
    if (isGeneratingImages) return;

    const slides = content
      .split(/\n\n+/)
      .filter(slide => slide.trim() !== '' && slide.trim() !== '---');

    setIsGeneratingImages(true);
    setError(null);
    setProgress({ current: 0, total: slides.length });
    
    try {
      const newImages: GeneratedImage[] = [];
      
      for (let i = 0; i < slides.length; i++) {
        const image = await imageQueue.add(slides[i]);
        if (image) {
          newImages.push(image);
        }
        setProgress(prev => ({ ...prev, current: i + 1 }));
      }

      setGeneratedImages(newImages);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const exportToPDF = async () => {
    if (!presentationRef.current || !deck.current || isExporting) return;
    
    setIsExporting(true);
    setError(null);

    try {
      // Save current slide
      const currentIndices = deck.current.getIndices();
      
      // Get all slides
      const slides = Array.from(presentationRef.current.querySelectorAll('section'));
      const totalSlides = slides.length;
      
      // Create PDF with landscape orientation
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080]
      });

      // Process each slide
      for (let i = 0; i < totalSlides; i++) {
        // Go to the slide
        deck.current.slide(i, 0);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const slideElement = slides[i];
        
        // Create a temporary container
        const container = document.createElement('div');
        container.style.width = '1920px';
        container.style.height = '1080px';
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.backgroundColor = 'white';
        container.style.overflow = 'hidden';
        
        // Clone and style the slide
        const slideClone = slideElement.cloneNode(true) as HTMLElement;
        slideClone.style.visibility = 'visible';
        slideClone.style.display = 'block';
        slideClone.style.transform = 'none';
        slideClone.style.width = '100%';
        slideClone.style.height = '100%';
        container.appendChild(slideClone);
        
        // Add to document temporarily
        document.body.appendChild(container);
        
        try {
          // Convert to canvas
          const canvas = await html2canvas(container, {
            width: 1920,
            height: 1080,
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: 'white',
            logging: false
          });
          
          // Add to PDF
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          if (i > 0) {
            pdf.addPage([1920, 1080], 'landscape');
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
          
        } finally {
          // Clean up
          document.body.removeChild(container);
        }
      }
      
      // Save the PDF
      pdf.save('presentation.pdf');
      
      // Restore original slide
      deck.current.slide(currentIndices.h, currentIndices.v, currentIndices.f);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('PDFの生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: number;

    const initializeReveal = async () => {
      if (!presentationRef.current || !mounted) return;

      try {
        if (deck.current) {
          const indices = deck.current.getIndices();
          currentSlideRef.current = {
            h: indices.h,
            v: indices.v,
            f: indices.f
          };
          deck.current.destroy();
          deck.current = null;
        }

        const newDeck = new Reveal(presentationRef.current, {
          embedded: true,
          hash: false,
          width: 960,
          height: 700,
          margin: 0.04,
          controls: true,
          progress: true,
          center: true,
          transition: 'none',
        });

        await newDeck.initialize();
        
        if (mounted) {
          deck.current = newDeck;

          newDeck.on('slidechanged', () => {
            if (deck.current) {
              const indices = deck.current.getIndices();
              currentSlideRef.current = {
                h: indices.h,
                v: indices.v,
                f: indices.f
              };
            }
          });

          if (currentSlideRef.current && contentRef.current !== content) {
            timeoutId = window.setTimeout(() => {
              if (deck.current && mounted) {
                deck.current.slide(
                  currentSlideRef.current.h,
                  currentSlideRef.current.v,
                  currentSlideRef.current.f
                );
              }
            }, 100);
          }
          
          contentRef.current = content;
        } else {
          try {
            newDeck.destroy();
          } catch (e) {
            console.warn('Error during Reveal cleanup after unmount:', e);
          }
        }
      } catch (error) {
        console.error('Error initializing Reveal:', error);
      }
    };

    requestAnimationFrame(() => {
      if (mounted) {
        initializeReveal();
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      if (deck.current) {
        try {
          deck.current.destroy();
        } catch (e) {
          console.warn('Error during Reveal cleanup on unmount:', e);
        }
        deck.current = null;
      }
    };
  }, [content]);

  const getRandomPosition = () => {
    const positions = [
      'top-0 left-0',
      'top-0 right-0',
      'bottom-0 left-0',
      'bottom-0 right-0',
      'top-1/2 -translate-y-1/2 left-0',
      'top-1/2 -translate-y-1/2 right-0',
    ];
    return positions[Math.floor(Math.random() * positions.length)];
  };

  const processSlideContent = (slideText: string, index: number) => {
    const lines = slideText.trim().split('\n');
    let html = '';
    let inList = false;
    let isFirstSlide = index === 0;
    
    const image = generatedImages[index];
    const imagePosition = getRandomPosition();
    
    if (image) {
      html += `<div class="absolute ${imagePosition} p-4 opacity-20 pointer-events-none">
        <img src="${image.url}" alt="${image.alt}" class="max-w-[300px] max-h-[300px] object-contain rounded-lg" />
      </div>`;
    }
    
    html += '<div class="relative z-10">';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine === '---') continue;
      
      const imageMatch = trimmedLine.match(/!\[(.*?)\]\((.*?)\)/);
      if (imageMatch) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        const [, alt, url] = imageMatch;
        html += `<div class="flex justify-center my-4">
          <img src="${url}" alt="${alt}" class="max-h-[500px] max-w-full object-contain rounded-lg shadow-lg" />
        </div>`;
        continue;
      }
      
      if (trimmedLine.startsWith('# ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        if (isFirstSlide) {
          html += `<h1 class="text-4xl font-bold mb-24">${trimmedLine.substring(2)}</h1>`;
        } else {
          html += `<h1 class="text-4xl font-bold mb-8">${trimmedLine.substring(2)}</h1>`;
        }
      } else if (trimmedLine.startsWith('## ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h2 class="text-2xl font-semibold mb-6 text-right">${trimmedLine.substring(3)}</h2>`;
      } else if (trimmedLine.startsWith('- ')) {
        if (!inList) {
          html += '<ul class="list-disc list-inside space-y-4">';
          inList = true;
        }
        html += `<li class="text-xl">${trimmedLine.substring(2)}</li>`;
      } else if (trimmedLine !== '') {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<p class="text-xl mb-4">${trimmedLine}</p>`;
      }
    }

    if (inList) {
      html += '</ul>';
    }

    html += '</div>';
    return html;
  };

  const slides = content
    .split(/\n\n+/)
    .filter(slide => slide.trim() !== '' && slide.trim() !== '---')
    .map((slide, index) => processSlideContent(slide.trim(), index));

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const element = presentationRef.current?.closest('.presentation-container');
        if (element) {
          if (deck.current) {
            deck.current.toggleOverview(false);
          }
          await element.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden relative">
      <div className="flex">
        <div className="presentation-container w-3/4 border-r border-gray-200 relative min-h-[700px]">
          {isGeneratingImages && (
            <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">画像を生成中... ({progress.current}/{progress.total})</p>
                {error && (
                  <p className="text-red-600 mt-2 text-sm">{error}</p>
                )}
              </div>
            </div>
          )}
          {isExporting && (
            <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">PDFを生成中...</p>
                {error && (
                  <p className="text-red-600 mt-2 text-sm">{error}</p>
                )}
              </div>
            </div>
          )}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              title="PDFとして保存"
            >
              <FileDown className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={generateImages}
              disabled={isGeneratingImages}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              title="AIで画像を生成"
            >
              <ImagePlus className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors"
              title={isFullscreen ? "全画面表示を終了" : "全画面表示に切り替え"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-6 h-6 text-white" />
              ) : (
                <Maximize2 className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
          <div className="reveal" ref={presentationRef}>
            <div className="slides">
              {slides.map((slideContent, index) => (
                <section 
                  key={index}
                  className="p-8"
                >
                  <div 
                    dangerouslySetInnerHTML={{ __html: slideContent }}
                    className="max-w-4xl mx-auto relative"
                  />
                </section>
              ))}
            </div>
          </div>
        </div>
        <div className="w-1/4 p-4">
          <h3 className="text-lg font-semibold mb-4">スライドの編集</h3>
          <div className="mb-4 text-sm text-gray-600">
            <p>フォーマットガイド:</p>
            <ul className="list-disc list-inside">
              <li># タイトル</li>
              <li>## サブタイトル</li>
              <li>- 箇条書き</li>
              <li>![代替テキスト](画像URL)</li>
              <li>空行で新しいスライド</li>
            </ul>
          </div>
          <textarea
            className="w-full h-[500px] p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            value={content}
            onChange={(e) => onSave(e.target.value)}
            placeholder="プレゼンテーションの内容を入力してください..."
          />
        </div>
      </div>
    </div>
  );
}