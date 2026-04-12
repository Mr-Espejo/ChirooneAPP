import { OpenAI } from "openai";
import fs from "node:fs";
import "dotenv/config";

export const llmService = {
  get client() {
    const model = process.env.KIEAI_LLM_MODEL || "gemini-3.1-pro";
    const baseURL = `https://api.kie.ai/${model}/v1`;
    fs.appendFileSync("llm_debug.log", `[${new Date().toISOString()}] Using baseURL: ${baseURL} for model: ${model}\n`);
    return new OpenAI({
      apiKey: process.env.KIEAI_API_KEY,
      baseURL,
    });
  },

  async chat(prompt: string, model: string = process.env.KIEAI_LLM_MODEL || "gemini-3.1-pro") {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });
    return response.choices[0].message.content;
  },

  async structured(prompt: string, schema: any, model: string = process.env.KIEAI_LLM_MODEL || "gemini-3.1-pro") {
    try {
      const baseURL = `https://api.kie.ai/${model}/v1/chat/completions`;
      const response = await fetch(baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.KIEAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: false
        })
      });
      const data = await response.json() as any;
      fs.appendFileSync("llm_debug.log", `[${new Date().toISOString()}] Response Status: ${response.status}\n`);
      
      const content = data.choices?.[0]?.message?.content || data.msg || "{}";
      const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error("[LLM Error]", (error as Error).message);
      throw error;
    }
  }
};
