import "dotenv/config";

export class KieaiService {
  private apiKey = process.env.KIEAI_API_KEY;

  async createVideoFromImage(imageUrl: string, prompt: string) {
    if (!this.apiKey) {
      console.warn("[KieaiService] KIEAI_API_KEY not found, mock task.");
      return { taskId: `mock-vid-${Date.now()}` };
    }

    try {
      const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "grok-imagine/image-to-video",
          input: {
            image_urls: [imageUrl],
            prompt: `${prompt}. Professional chiropractic aesthetic. High quality 4k.`,
            mode: "normal",
            duration: "30",
            resolution: "720p",
            aspect_ratio: "9:16",
            fps: 30
          }
        })
      });

      const result = await response.json() as any;
      const taskId = result.data?.taskId || result.taskId;

      if (!taskId) throw new Error(`Failed to get taskId: ${JSON.stringify(result)}`);

      return { taskId };
    } catch (error: any) {
      console.error("[KieaiService] Error creating video task:", error.message);
      throw error;
    }
  }
}

export const kieaiService = new KieaiService();
