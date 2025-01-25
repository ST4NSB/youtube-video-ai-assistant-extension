function getMainConfig() {
  return {
    DEBUG: true,
  };
}

async function getAIConfigObject() {
  return {
    AI_MODE: 1, // 1 - chat with role and message, 2 - chat with prompt only
    AI_MODEL: "llama3.2", // deepseek-r1:8b
    AI_TEMPERATURE: 0.25,

    PREVIOUS_CONTEXT_LIMIT: 1,
    ANSWER_LIMIT: 1200,

    AI_CHAT_API: {
      URL: "http://localhost:11434/api/chat",
      METHOD: "POST",
    },
    AI_PROMPT_API: {
      URL: "http://localhost:11434/api/generate",
      METHOD: "POST",
    },
    TIMESTAMP_EXTRACT_REGEX: /\[(\d+)\]/g,
    TIMESTAMPARRAY_EXTRACT_REGEX: /\[(\d+(?:,\s*\d+)*)\]/g,
    TIMESTAMPRANGE_EXTRACT_REGEX: /\[(\d+)-(\d+)\]/g,
  };
}

function getYouTubeConfigObject() {
  return {
    DETAILED_CAPTION_TIMESTAMPS: false,

    // 1 token ~= 3 chars in English
    TOKEN_MAX: 25000,
    TOKEN_RETRY_DESCREASE_VALUE: 0,

    YOUTUBE_API: {
      URL: "https://www.youtube.com/watch?v=",
      METHOD: "GET",
    },
    CAPTION_EXTRACT_REGEX: /"captionTracks":\[\{"baseUrl":"(.*?)"/,
    VIDEOID_EXTRACT_REGEX: /[?&]v=([^&]+)/,
  };
}
