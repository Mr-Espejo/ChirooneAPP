import "dotenv/config";

export class MediaService {
  private apiKey: string | undefined = process.env.KIEAI_API_KEY;
  private logoUrl = "https://firebasestorage.googleapis.com/v0/b/studio-7377357488-df5a7.firebasestorage.app/o/MotaiCustomers%2FChiroone-Logo-2.png?alt=media&token=142d6e1c-a584-4de7-979b-5401852db595";

  async createMediaTask(prompt: string, aspectRatio: string, companyId: string, postId: string) {
    if (!this.apiKey) {
      console.warn("[MediaService] KIEAI_API_KEY not found, using mock task ID.");
      return "mock-task-id";
    }

    try {
      const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${this.apiKey}` 
        },
        body: JSON.stringify({
          model: "nano-banana-2",
          callBackUrl: `https://chiro-api.com/webhook/media/${companyId}/${postId}`,
          input: {
            prompt: `${prompt}. Please ensure the brand logo from the reference image is placed naturally in the scene (e.g. on a wall, sign, or item).`,
            image_input: [this.logoUrl],
            aspect_ratio: aspectRatio,
            resolution: "1K",
            output_format: "jpg"
          }
        })
      });

      const data = await response.json() as any;
      return data.data?.taskId || data.taskId || "mock-task-id";
    } catch (error) {
      console.error("[MediaService] Error creating task:", error);
      return "mock-task-id";
    }
  }
}

export const mediaService = new MediaService();
