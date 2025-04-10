import React, { useState } from 'react';
import { InitialForm } from './components/InitialForm';
import { PresentationEditor } from './components/PresentationEditor';
import { openai } from './lib/openai';

function App() {
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const completion = await openai.chat.completions.create({
        messages: [
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
8. DO NOT include any transition text or notes between slides`
          },
          {
            role: "user",
            content: `Create a presentation outline with exactly ${data.slideCount} slides.\nTitle: ${data.title}\nCompany: ${data.company}\nCreator: ${data.creator}\nOverview: ${data.overview}\nPurpose: ${data.purpose}\n\nIMPORTANT: The presentation MUST have EXACTLY ${data.slideCount} slides, no more and no less.`
          }
        ],
        model: "gpt-4-turbo-preview",
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;
      if (content) {
        // Split content into slides and ensure exact count
        const slides = content
          .split(/\n\n+/)
          .filter(slide => slide.trim() !== '' && slide.trim() !== '---');

        if (slides.length < data.slideCount) {
          throw new Error(`AI generated only ${slides.length} slides instead of the requested ${data.slideCount} slides. Please try again.`);
        }

        // Take exactly the number of slides requested
        const finalSlides = slides.slice(0, data.slideCount);
        const formattedContent = finalSlides.join('\n\n');
        
        setGeneratedContent(formattedContent);
        setIsEditing(true);
      } else {
        throw new Error('No content generated');
      }
    } catch (error) {
      console.error('Error generating presentation:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate presentation. Please try again.');
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentSave = (newContent: string) => {
    setGeneratedContent(newContent);
  };

  const handleBack = () => {
    setIsEditing(false);
    setGeneratedContent(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {!isEditing ? (
        <div className="flex items-center justify-center">
          <InitialForm 
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
          />
        </div>
      ) : generatedContent ? (
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              ← Back to Form
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Finish Editing
            </button>
          </div>
          <PresentationEditor
            content={generatedContent}
            onSave={handleContentSave}
          />
        </div>
      ) : null}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;