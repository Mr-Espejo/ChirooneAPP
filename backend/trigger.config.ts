import type { TriggerConfig } from "@trigger.dev/sdk";

export const config: TriggerConfig = {
  project: "proj_dkclmcrccgwxxswwgwzc", // Updated with user's project ref
  dirs: ["triggers"], // Replaced deprecated triggerDirectories
  maxDuration: 60,
  onSuccess: (job) => {
    console.log(`[Trigger.dev] Job ${job.id} completed successfully.`);
  },
  onFailure: (job, error) => {
    console.error(`[Trigger.dev] Job ${job.id} failed:`, error);
  },
};
