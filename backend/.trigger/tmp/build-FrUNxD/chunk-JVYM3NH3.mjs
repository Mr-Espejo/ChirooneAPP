import {
  prisma
} from "./chunk-5447UIJE.mjs";
import {
  __name,
  init_esm
} from "./chunk-5A2LE32G.mjs";

// modules/publishing/publishing.service.ts
init_esm();

// integrations/composioService.ts
init_esm();
var ComposioService = class {
  static {
    __name(this, "ComposioService");
  }
  ig = {
    accountId: "0b6c39bd-3100-4b5c-9aa0-d2976fb532b5",
    userId: "17841466819125136"
  };
  fb = {
    pageId: "343192448887259",
    pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN || ""
  };
  yt = {
    clientId: process.env.YOUTUBE_CLIENT_ID || "",
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || "",
    refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || ""
  };
  tt = {
    accessToken: process.env.TIKTOK_ACCESS_TOKEN || ""
  };
  _toolset = null;
  _google = null;
  async getToolset() {
    if (!this._toolset) {
      const { ComposioToolSet } = await import("./composio-core-RA4MY5NS.mjs");
      this._toolset = new ComposioToolSet({
        apiKey: process.env.COMPOSIO_API_KEY || ""
      });
    }
    return this._toolset;
  }
  async getGoogle() {
    if (!this._google) {
      const { google } = await import("./src-LVVCKKPC.mjs");
      this._google = google;
    }
    return this._google;
  }
  constructor() {
  }
  async publishMedia(mediaUrl, caption, platform, options = {}) {
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
  async publishToFacebook(mediaUrl, description, title) {
    const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(mediaUrl);
    const endpoint = isVideo ? `https://graph.facebook.com/v20.0/${this.fb.pageId}/videos` : `https://graph.facebook.com/v20.0/${this.fb.pageId}/photos`;
    const body = new URLSearchParams({ description, published: "true", access_token: this.fb.pageAccessToken });
    if (isVideo) {
      body.set("file_url", mediaUrl);
      if (title) body.set("title", title);
    } else {
      body.set("url", mediaUrl);
      body.set("caption", description);
    }
    const res = await fetch(endpoint, { method: "POST", body });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(`[Facebook] ${json.error?.message ?? `HTTP ${res.status}`}`);
    console.log(`[Facebook] Published. ID: ${json.id}`);
    return { success: true, platform: "facebook", id: json.id };
  }
  async publishToInstagram(mediaUrl, caption, coverUrl) {
    const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(mediaUrl);
    console.log("[Instagram] Step 1: Creating media container...");
    const toolset = await this.getToolset();
    const containerRes = await toolset.executeAction({
      actionName: "INSTAGRAM_CREATE_MEDIA_CONTAINER",
      params: {
        ig_user_id: this.ig.userId,
        caption,
        ...isVideo ? { video_url: mediaUrl, cover_url: coverUrl, media_type: "REELS", content_type: "reel" } : { image_url: mediaUrl }
      },
      connectedAccountId: this.ig.accountId
    });
    if (!containerRes.successful) throw new Error(`[Instagram] Container creation failed: ${containerRes.error}`);
    const creationId = containerRes.data.id;
    console.log(`[Instagram] Container created: ${creationId}`);
    if (isVideo) {
      console.log("[Instagram] Step 2: Polling until media is ready...");
      const ready = await this.waitUntilIgReady(creationId);
      if (!ready) throw new Error("[Instagram] Media processing timed out or failed.");
    }
    console.log("[Instagram] Step 3: Publishing...");
    const publishRes = await toolset.executeAction({
      actionName: "INSTAGRAM_CREATE_POST",
      params: { ig_user_id: this.ig.userId, creation_id: creationId },
      connectedAccountId: this.ig.accountId
    });
    if (!publishRes.successful) throw new Error(`[Instagram] Publish failed: ${publishRes.error}`);
    console.log(`[Instagram] Published. ID: ${publishRes.data.id}`);
    return { success: true, platform: "instagram", id: publishRes.data.id };
  }
  async waitUntilIgReady(creationId, maxWaitMs = 18e4) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 1e4));
      const toolset = await this.getToolset();
      const res = await toolset.executeAction({
        actionName: "INSTAGRAM_GET_POST_STATUS",
        params: { creation_id: creationId },
        connectedAccountId: this.ig.accountId
      });
      const status = res?.data?.status_code ?? "UNKNOWN";
      console.log(`[Instagram] Status: ${status} (${Math.round((Date.now() - start) / 1e3)}s)`);
      if (status === "FINISHED") return true;
      if (status === "ERROR" || status === "EXPIRED") return false;
    }
    return false;
  }
  async getInsights(_postId) {
    return { views: 120, likes: 15, shares: 2 };
  }
  async publishToYoutube(mediaUrl, description, title, tags) {
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
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    console.log("[YouTube] Step 2: Iniciando stream desde origen...");
    const vidRes = await fetch(mediaUrl);
    if (!vidRes.body) throw new Error("[YouTube] Falló la descarga del video.");
    const contentLength = vidRes.headers.get("content-length");
    console.log(`[YouTube] Step 3: Iniciando subida (${contentLength} bytes)...`);
    const res = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: title || "ChiroOne Short",
          description,
          tags: tags || ["chiropractor", "goldcoast", "health"],
          categoryId: "22"
        },
        status: {
          privacyStatus: "private",
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: vidRes.body
        // Direct stream
      }
    });
    if (!res.data.id) {
      throw new Error(`[YouTube] Falló la subida. Respuesta anómala de Google.`);
    }
    console.log(`[YouTube] Publicado. ID: ${res.data.id}`);
    return { success: true, platform: "youtube", id: res.data.id };
  }
  async publishToTikTok(mediaUrl, description, title) {
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
          title: title ? `${title} 

${description}` : description,
          privacy_level: "SELF_ONLY",
          // Recomendado dejar privado hasta auditar la app de TikTok
          disable_comment: false,
          video_cover_timestamp_ms: 1e3
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
    console.log(`[TikTok] Step 3: URL generada. Transmitiendo archivo (${fileSize} bytes)...`);
    const uploadRequest = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileSize.toString(),
        "Content-Range": `bytes 0-${fileSize - 1}/${fileSize}`
      },
      body: vidRes.body
      // Direct stream from fetch
    });
    if (uploadRequest.status >= 200 && uploadRequest.status < 300) {
      console.log(`[TikTok] ✅ Archivo subido con éxito. ID: ${publishId}`);
      return { success: true, platform: "tiktok", id: publishId };
    } else {
      throw new Error(`[TikTok] ❌ Falló la subida final HTTP ${uploadRequest.status}`);
    }
  }
};
var composioService = new ComposioService();

// modules/publishing/publishing.service.ts
var PublishingService = class {
  static {
    __name(this, "PublishingService");
  }
  async publishPendingPosts(options = {}) {
    const pendingPosts = await prisma.post.findMany({
      where: {
        status: "READY_TO_PUBLISH",
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: /* @__PURE__ */ new Date() } }
        ]
      },
      include: {
        contentItem: true
      }
    });
    if (pendingPosts.length === 0) {
      return { message: "No pending posts found" };
    }
    const results = [];
    for (const post of pendingPosts) {
      try {
        if (!post.contentItem.mediaUrl) {
          throw new Error(`Post ${post.id} missing media URL`);
        }
        const caption = `${post.contentItem.hook}

${post.contentItem.body}

${post.contentItem.cta}`;
        const platform = post.platform.toLowerCase();
        if (options.dryRun) {
          console.log(`[DryRun] Would publish post ${post.id} to ${platform}`);
          results.push({ id: post.id, status: "DRY_RUN", platform });
          continue;
        }
        const finalMediaUrl = post.contentItem.videoUrl || post.contentItem.mediaUrl;
        if (!finalMediaUrl) {
          throw new Error(`Post ${post.id} missing media URL`);
        }
        const response = await composioService.publishMedia(
          finalMediaUrl,
          caption,
          platform
        );
        if (response.success) {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: "PUBLISHED",
              publishedAt: /* @__PURE__ */ new Date(),
              externalLink: `https://${platform}.com/posts/${post.id}`,
              lastError: null
            }
          });
          results.push({ id: post.id, status: "SUCCESS" });
        }
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error);
        if (!options.dryRun) {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: "FAILED",
              lastError: error.message
            }
          });
        }
        results.push({ id: post.id, status: "FAILED", error: error.message });
      }
    }
    return results;
  }
};
var publishingService = new PublishingService();

export {
  PublishingService,
  publishingService
};
//# sourceMappingURL=chunk-JVYM3NH3.mjs.map
