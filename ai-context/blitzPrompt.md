Act as a Senior Creative Director and Copywriter. 
Based on the attached BRAND DNA, generate a 7-day Instagram content plan.

BRAND DNA: {{brandDna}}

Respond EXCLUSIVELY with a JSON object containing a "plan" property with an array of 7 objects.
ALL fields (captions, prompts, etc.) MUST be in English.

JSON structure:
{
  "plan": [
    {
      "day": "Monday",
      "topic": "Suggested Title",
      "caption": "Persuasive and engaging copy for the post...",
      "image_prompt": "Cinematic and detailed prompt to generate the BASE IMAGE (static)...",
      "video_prompt": "MOTION prompt to animate the base image (e.g., 'The camera zooms in slowly', 'Water flows gently')...",
      "aspect_ratio": "9:16"
    }
  ]
}
