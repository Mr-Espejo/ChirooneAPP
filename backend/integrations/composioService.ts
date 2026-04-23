import { ComposioToolSet } from "composio-core";
import { google } from "googleapis";
import { Readable } from "node:stream";

export class ComposioService {
  private ig = {
    accountId: process.env.COMPOSIO_IG_ACCOUNT_ID || "0b6c39bd-3100-4b5c-9aa0-d2976fb532b5",
    userId: process.env.COMPOSIO_IG_USER_ID || "17841466819125136",
  };

  private fb = {
    pageId: process.env.FB_PAGE_ID || "343192448887259",
    pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN || "",
  };

  private yt = {
    clientId: process.env.YOUTUBE_CLIENT_ID || "",
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || "",
    refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || "",
  };

  private tt = {
    accessToken: process.env.TIKTOK_ACCESS_TOKEN || "",
  };

  private _toolset: any | null = null;
  private _google: any | null = null;

  private async getToolset(): Promise<any> {
    if (!this._toolset) {
      this._toolset = new ComposioToolSet({
        apiKey: process.env.COMPOSIO_API_KEY || "",
      });
    }
    return this._toolset;
  }

  private async getGoogle(): Promise<any> {
    return google;
  }

  constructor() { }

  async publishMedia(
    mediaUrl: string,
    caption: string,
    platform: "instagram" | "facebook" | "youtube" | "tiktok",
    options: { title?: string; coverUrl?: string; tags?: string[] } = {}
  ): Promise<PublishResult> {
    if (!process.env.COMPOSIO_API_KEY) {
      console.warn("[Composio] Missing API KEY, simulating success.");
      return { success: true, platform, id: `SIM_${platform.toUpperCase()}_${Date.now()}` };
    }

    if (platform === "facebook") return this.publishToFacebook(mediaUrl, caption, options.title);
    if (platform === "instagram") return this.publishToInstagram(mediaUrl, caption, options.coverUrl);
    if (platform === "youtube") return this.publishToYoutube(mediaUrl, caption, options.title, options.tags);
    if (platform === "tiktok") return this.publishToTikTok(mediaUrl, caption, options.title);

    throw new Error(`Platform ${platform} not implemented.`);
  }

  private async publishToFacebook(mediaUrl: string, description: string, title?: string): Promise<PublishResult> {
    const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(mediaUrl);
    
    console.log("[Facebook] Publishing via Composio...");
    const toolset = await this.getToolset();
    const res: any = await toolset.executeAction({
      actionName: isVideo ? "FACEBOOK_CREATE_VIDEO_POST" : "FACEBOOK_CREATE_PHOTO_POST",
      params: {
        page_id: this.fb.pageId,
        ...(isVideo 
          ? { file_url: mediaUrl, description: description, title: title }
          : { url: mediaUrl, caption: description })
      },
      connectedAccountId: this.ig.accountId, // Usamos la misma conexión de Meta si están vinculadas
    });

    if (!res.successful) throw new Error(`[Facebook] Publish failed: ${res.error}`);

    console.log(`[Facebook] Published successfully.`);
    return { success: true, platform: "facebook", id: res.data.id || "SUCCESS" };
  }

  private async publishToInstagram(mediaUrl: string, caption: string, coverUrl?: string): Promise<PublishResult> {
    const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(mediaUrl);

    console.log("[Instagram] Step 1: Creating media container...");
    const toolset = await this.getToolset();
    const containerRes: any = await toolset.executeAction({
      actionName: "INSTAGRAM_CREATE_MEDIA_CONTAINER",
      params: {
        ig_user_id: this.ig.userId,
        caption,
        ...(isVideo
          ? { video_url: mediaUrl, cover_url: coverUrl, media_type: "REELS", content_type: "reel" }
          : { image_url: mediaUrl }),
      },
      connectedAccountId: this.ig.accountId,
    });

    if (!containerRes.successful) throw new Error(`[Instagram] Container creation failed: ${containerRes.error}`);

    const creationId: string = containerRes.data.id;
    console.log(`[Instagram] Container created: ${creationId}`);

    if (isVideo) {
      console.log("[Instagram] Step 2: Polling until media is ready...");
      const ready = await this.waitUntilIgReady(creationId);
      if (!ready) throw new Error("[Instagram] Media processing timed out or failed.");
    }

    console.log("[Instagram] Step 3: Publishing...");
    const publishRes: any = await toolset.executeAction({
      actionName: "INSTAGRAM_CREATE_POST",
      params: { ig_user_id: this.ig.userId, creation_id: creationId },
      connectedAccountId: this.ig.accountId,
    });

    if (!publishRes.successful) throw new Error(`[Instagram] Publish failed: ${publishRes.error}`);

    console.log(`[Instagram] Published. ID: ${publishRes.data.id}`);
    return { success: true, platform: "instagram", id: publishRes.data.id };
  }

  private async waitUntilIgReady(creationId: string, maxWaitMs = 180_000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise(r => setTimeout(r, 10_000));

      const toolset = await this.getToolset();
      const res: any = await toolset.executeAction({
        actionName: "INSTAGRAM_GET_POST_STATUS",
        params: { creation_id: creationId },
        connectedAccountId: this.ig.accountId,
      });

      const status: string = res?.data?.status_code ?? "UNKNOWN";
      console.log(`[Instagram] Status: ${status} (${Math.round((Date.now() - start) / 1000)}s)`);

      if (status === "FINISHED") return true;
      if (status === "ERROR" || status === "EXPIRED") return false;
    }
    return false;
  }

  async getInsights(_postId: string) {
    return { views: 120, likes: 15, shares: 2 };
  }

  private async publishToYoutube(mediaUrl: string, description: string, title?: string, tags?: string[]): Promise<PublishResult> {
    console.log("[YouTube] Step 1: Inicializando cliente OAuth y refrescando token...");
    if (!this.yt.refreshToken) {
      throw new Error("[YouTube] Fatal Error: Falta YOUTUBE_REFRESH_TOKEN en el .env.");
    }

    const google = await this.getGoogle();
    const oauth2Client = new google.auth.OAuth2(
      this.yt.clientId,
      this.yt.clientSecret
    );
    oauth2Client.setCredentials({ refresh_token: this.yt.refreshToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    console.log("[YouTube] Step 2: Iniciando stream desde origen...");
    const vidRes = await fetch(mediaUrl);
    if (!vidRes.body) throw new Error("[YouTube] Falló la descarga del video.");
    const contentLength = vidRes.headers.get("content-length");
    const arrayBuffer = await vidRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[YouTube] Step 3: Iniciando subida (${contentLength} bytes)...`);

    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title || "ChiroOne Short",
          description: description,
          tags: tags || ['chiropractor', 'goldcoast', 'health'],
          categoryId: '22'
        },
        status: {
          privacyStatus: 'private',
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: Readable.from(buffer)
      }
    });

    if (!res.data.id) {
      throw new Error(`[YouTube] Falló la subida. Respuesta anómala de Google.`);
    }

    console.log(`[YouTube] Publicado. ID: ${res.data.id}`);
    return { success: true, platform: "youtube", id: res.data.id };
  }

  private async publishToTikTok(mediaUrl: string, description: string, title?: string): Promise<PublishResult> {
    console.log("[TikTok] Step 1: Inicializando auth y descargando video...");
    if (!this.tt.accessToken) {
      throw new Error("[TikTok] Fatal Error: Falta TIKTOK_ACCESS_TOKEN en el .env.");
    }

    const vidRes = await fetch(mediaUrl);
    const fileSizeStr = vidRes.headers.get("content-length");
    if (!fileSizeStr || !vidRes.body) throw new Error("[TikTok] No se pudo obtener el tamaño o cuerpo del video.");
    const fileSize = parseInt(fileSizeStr);

    console.log("[TikTok] Step 2: Iniciando subida directa (Content Posting API)...");
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.tt.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8"
      },
      body: JSON.stringify({
        post_info: {
          title: title ? `${title} \n\n${description}` : description,
          privacy_level: "SELF_ONLY", // Recomendado dejar privado hasta auditar la app de TikTok
          disable_comment: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: fileSize,
          chunk_size: fileSize,
          total_chunk_count: 1
        }
      })
    });

    const initData = await initRes.json();
    if (initData.error?.code !== "ok" || !initData.data?.upload_url) {
      throw new Error(`[TikTok] Error de inicio: ${JSON.stringify(initData)}`);
    }

    const publishId = initData.data.publish_id;
    const uploadUrl = initData.data.upload_url;

    const arrayBuffer = await vidRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[TikTok] Step 3: URL generada. Transmitiendo archivo (${fileSize} bytes)...`);
    const uploadRequest = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileSize.toString(),
        "Content-Range": `bytes 0-${fileSize - 1}/${fileSize}`
      },
      body: buffer // ArrayBuffer/Buffer
    });

    if (uploadRequest.status >= 200 && uploadRequest.status < 300) {
      console.log(`[TikTok] ✅ Archivo subido con éxito. ID: ${publishId}`);
      return { success: true, platform: "tiktok", id: publishId };
    } else {
      throw new Error(`[TikTok] ❌ Falló la subida final HTTP ${uploadRequest.status}`);
    }
  }
}

export const composioService = new ComposioService();
