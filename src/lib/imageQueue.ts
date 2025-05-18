
interface QueueItem {
  slideContent: string;
  resolve: (value: GeneratedImage | null) => void;
}

interface GeneratedImage {
  id: string;
  url: string;
  alt: string;
}

class ImageGenerationQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private lastProcessedTime = 0;
  private readonly RATE_LIMIT = 5; // Images per minute
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
  private processedInWindow = 0;

  async add(slideContent: string): Promise<GeneratedImage | null> {
    return new Promise((resolve) => {
      this.queue.push({ slideContent, resolve });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      
      // Reset counter if we're in a new time window
      if (now - this.lastProcessedTime >= this.RATE_LIMIT_WINDOW) {
        this.processedInWindow = 0;
        this.lastProcessedTime = now;
      }

      // Wait if we've hit the rate limit
      if (this.processedInWindow >= this.RATE_LIMIT) {
        const waitTime = this.RATE_LIMIT_WINDOW - (now - this.lastProcessedTime);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const item = this.queue.shift();
      if (!item) break;

      try {
        const result = await this.generateImage(item.slideContent);
        item.resolve(result);
        this.processedInWindow++;
      } catch (error) {
        console.error('Error generating image:', error);
        item.resolve(null);
      }
    }

    this.processing = false;
  }

  private async generateImage(slideContent: string): Promise<GeneratedImage | null> {
    try {
      const textContent = slideContent.replace(/!\[.*?\]\(.*?\)/g, '').replace(/[#\-]/g, '').trim();
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Create a professional presentation slide image that represents: ${textContent}. Make it abstract and subtle, suitable as a background or complementary image for a business presentation.`
        })
      });
      if (!response.ok) {
        throw new Error(`Image generation failed with status ${response.status}`);
      }
      const data: { url?: string } = await response.json();

      if (data.url) {
        return {
          id: crypto.randomUUID(),
          url: data.url,
          alt: `AI generated image for: ${textContent.substring(0, 50)}...`
        };
      }
    } catch (error) {
      console.error('Error in generateImage:', error);
      throw error;
    }
    return null;
  }
}

export const imageQueue = new ImageGenerationQueue();