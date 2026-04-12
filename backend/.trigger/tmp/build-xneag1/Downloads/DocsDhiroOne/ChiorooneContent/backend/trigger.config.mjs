import {
  __name,
  init_esm
} from "../../../../chunk-5A2LE32G.mjs";

// trigger.config.ts
init_esm();
var config = {
  // Updated with user's project ref
  project: "proj_dkclmcrccgwxxswwgwzc",
  // Replaced deprecated triggerDirectories
  dirs: ["triggers"],
  maxDuration: 60,
  onSuccess: /* @__PURE__ */ __name((job) => {
    console.log(`[Trigger.dev] Job ${job.id} completed successfully.`);
  }, "onSuccess"),
  onFailure: /* @__PURE__ */ __name((job, error) => {
    console.error(`[Trigger.dev] Job ${job.id} failed:`, error);
  }, "onFailure"),
  build: {}
};
var resolveEnvVars = void 0;
export {
  config,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
