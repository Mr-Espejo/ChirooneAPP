import "./chunk-ZQY6LADE.mjs";
import {
  __name,
  init_esm
} from "./chunk-5A2LE32G.mjs";

// integrations/kieaiService.ts
init_esm();
var KieaiService = class {
  static {
    __name(this, "KieaiService");
  }
  apiKey = process.env.KIEAI_API_KEY;
  async createVideoFromImage(imageUrl, prompt) {
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
          model: "grok-itv-1",
          // Image to Video model
          input: {
            image_url: imageUrl,
            prompt: `Cinematic motion: ${prompt}. Professional chiropractic aesthetic. High quality 4k.`,
            duration: 10,
            fps: 30
          }
        })
      });
      const result = await response.json();
      const taskId = result.data?.taskId || result.taskId;
      if (!taskId) throw new Error(`Failed to get taskId: ${JSON.stringify(result)}`);
      return { taskId };
    } catch (error) {
      console.error("[KieaiService] Error creating video task:", error.message);
      throw error;
    }
  }
};
var kieaiService = new KieaiService();
export {
  KieaiService,
  kieaiService
};
//# sourceMappingURL=kieaiService-VUOTXEWW.mjs.map
