import { google } from "googleapis";
import { Readable } from "node:stream";
import { Bundlesocial } from "bundlesocial";
import fs from "node:fs";
import path from "node:path";

export class ComposioService {
  private ig = {
    accountId: process.env.COMPOSIO_IG_ACCOUNT_ID || "0b6c39bd-3100-4b5c-9aa0-d2976fb532b5",
    userId: process.env.COMPOSIO_IG_USER_ID || "17841460505055027",
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
    bundleApiKey: process.env.BUNDLE_API_KEY || "",
    bundleTeamId: process.env.BUNDLE_TEAM_ID || "",
  };

  private _toolset: any | null = null;
  private _google: any | null = null;
  private _bundle: Bundlesocial | null = null;

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

  private async getBundle(): Promise<Bundlesocial> {
    if (!this._bundle) {
      if (!this.tt.bundleApiKey) {
        throw new Error("[BundleSocial] Missing BUNDLE_API_KEY in environment variables");
      }
      this._bundle = new Bundlesocial(this.tt.bundleApiKey);
    }
    return this._bundle;
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
    
    console.log(`[Facebook] Publishing ${isVideo ? 'video' : 'photo'} directly via Graph API...`);
    
    if (!this.fb.pageAccessToken) {
      throw new Error("[Facebook] Missing FB_PAGE_ACCESS_TOKEN in environment variables");
    }

    const endpoint = isVideo 
      ? `https://graph.facebook.com/v20.0/${this.fb.pageId}/videos`
      : `https://graph.facebook.com/v20.0/${this.fb.pageId}/photos`;

    const body = isVideo 
      ? { access_token: this.fb.pageAccessToken, file_url: mediaUrl, description: description, title: title || "" }
      : { access_token: this.fb.pageAccessToken, url: mediaUrl, message: description };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(`[Facebook] Publish failed: ${JSON.stringify(data.error || data)}`);
    }

    console.log(`[Facebook] Published successfully. ID: ${data.id}`);
    return { success: true, platform: "facebook", id: data.id || "SUCCESS" };
  }

  private async publishToInstagram(mediaUrl: string, caption: string, coverUrl?: string): Promise<PublishResult> {
    const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(mediaUrl);

    console.log(`[Instagram] Step 1: Creating ${isVideo ? 'video' : 'image'} container via Graph API...`);
    
    if (!this.fb.pageAccessToken) {
      throw new Error("[Instagram] Missing FB_PAGE_ACCESS_TOKEN in environment variables");
    }

    const endpoint = `https://graph.facebook.com/v20.0/${this.ig.userId}/media`;
    const body = isVideo 
      ? { 
          access_token: this.fb.pageAccessToken, 
          video_url: mediaUrl, 
          caption: caption, 
          media_type: "REELS", 
          share_to_feed: true,
          cover_url: coverUrl
        }
      : { 
          access_token: this.fb.pageAccessToken, 
          image_url: mediaUrl, 
          caption: caption 
        };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(`[Instagram] Container creation failed: ${JSON.stringify(data.error || data)}`);
    }

    const creationId = data.id;
    console.log(`[Instagram] Container created: ${creationId}`);

    if (isVideo) {
      console.log("[Instagram] Step 2: Polling until media is ready...");
      const ready = await this.waitUntilIgReady(creationId);
      if (!ready) throw new Error("[Instagram] Media processing timed out or failed.");
    }

    console.log("[Instagram] Step 3: Publishing...");
    const publishEndpoint = `https://graph.facebook.com/v20.0/${this.ig.userId}/media_publish`;
    const publishResponse = await fetch(publishEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: this.fb.pageAccessToken,
        creation_id: creationId
      })
    });

    const publishData = await publishResponse.json();
    if (!publishResponse.ok || publishData.error) {
      throw new Error(`[Instagram] Publish failed: ${JSON.stringify(publishData.error || publishData)}`);
    }

    console.log(`[Instagram] Published. ID: ${publishData.id}`);
    return { success: true, platform: "instagram", id: publishData.id };
  }

  private async waitUntilIgReady(creationId: string, maxWaitMs = 180_000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise(r => setTimeout(r, 10_000));

      const response = await fetch(`https://graph.facebook.com/v20.0/${creationId}?fields=status_code&access_token=${this.fb.pageAccessToken}`);
      const data = await response.json();
      
      const status = data?.status_code ?? "UNKNOWN";
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

    console.log("[YouTube] Step 2: Preparando video para subida...");
    let videoStream: Readable;

    if (mediaUrl.startsWith("http")) {
      console.log(`[YouTube] Descargando video desde URL: ${mediaUrl}`);
      const vidRes = await fetch(mediaUrl);
      if (!vidRes.body) throw new Error("[YouTube] Falló la descarga del video.");
      const arrayBuffer = await vidRes.arrayBuffer();
      videoStream = Readable.from(Buffer.from(arrayBuffer));
    } else {
      console.log(`[YouTube] Cargando video local: ${mediaUrl}`);
      if (!fs.existsSync(mediaUrl)) {
        throw new Error(`[YouTube] Archivo local no encontrado: ${mediaUrl}`);
      }
      videoStream = fs.createReadStream(mediaUrl);
    }

    console.log("[YouTube] Step 3: Iniciando subida a YouTube...");

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
          privacyStatus: 'public', // Cambiado a public para que sea visible
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: videoStream
      }
    });

    if (!res.data.id) {
      throw new Error(`[YouTube] Falló la subida. Respuesta anómala de Google.`);
    }

    console.log(`[YouTube] Publicado. ID: ${res.data.id}`);
    return { success: true, platform: "youtube", id: res.data.id };
  }

  private async publishToTikTok(mediaUrl: string, description: string, title?: string): Promise<PublishResult> {
    console.log("[TikTok] Starting publishing via BundleSocial...");
    
    if (!this.tt.bundleTeamId) {
      throw new Error("[TikTok] Missing BUNDLE_TEAM_ID in environment variables");
    }

    const bundle = await this.getBundle();
    let uploadId: string;

    // Check if mediaUrl is a local path or remote URL
    if (mediaUrl.startsWith("http")) {
      console.log(`[TikTok] Creating upload from URL: ${mediaUrl}`);
      const uploadResponse = await bundle.upload.uploadCreateFromUrl({
        requestBody: {
          teamId: this.tt.bundleTeamId,
          url: mediaUrl
        }
      });
      uploadId = uploadResponse.id;
    } else {
      console.log(`[TikTok] Creating upload from local file: ${mediaUrl}`);
      if (!fs.existsSync(mediaUrl)) {
        throw new Error(`[TikTok] Local file not found: ${mediaUrl}`);
      }
      
      const fileBuffer = await fs.promises.readFile(mediaUrl);
      const fileName = path.basename(mediaUrl);
      const file = new File([fileBuffer], fileName, { type: "video/mp4" });

      const uploadResponse = await bundle.upload.uploadCreate({
        formData: {
          teamId: this.tt.bundleTeamId,
          file: file as any // Casting due to potential type mismatch in generated SDK
        }
      });
      uploadId = uploadResponse.id;
    }

    console.log(`[TikTok] Upload created. ID: ${uploadId}. Creating post...`);

    const postResponse = await bundle.post.postCreate({
      requestBody: {
        teamId: this.tt.bundleTeamId,
        title: title || "TikTok Post",
        postDate: new Date().toISOString(),
        status: "SCHEDULED",
        socialAccountTypes: ["TIKTOK"],
        data: {
          TIKTOK: {
            type: "VIDEO",
            text: title ? `${title}\n\n${description}` : description,
            uploadIds: [uploadId]
          }
        }
      }
    });

    console.log(`[TikTok] ✅ Published via BundleSocial. ID: ${postResponse.id}`);
    return { success: true, platform: "tiktok", id: postResponse.id };
  }
}

export const composioService = new ComposioService();
