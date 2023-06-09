async function getEnvironmentVariables() {
  const response = await fetch(chrome.runtime.getURL(".env"));
  const text = await response.text();
  const env = Object.fromEntries(
    text.split("\r\n").map((line) => line.split("="))
  );
  return {
    CHATGPT_KEY: env.CHATGPT_KEY,
  };
}

function getMainConfig() {
  return {
    DEBUG: true,
  };
}

async function getChatGptConfigObject() {
  return {
    CHATGPT_MODE: 1, // 1 - CHATGPT_CHAT_URL, 2 - CHATGPT_PROMPT_URL
    CHATGPT_MODEL: "gpt-3.5-turbo", // 1 - "gpt-3.5-turbo", 2 - "text-davinci-003"
    CHATGPT_TEMPERATURE: 0.75,

    PREVIOUS_CONTEXT_LIMIT: 1,
    ANSWER_LIMIT: 400,

    CHATGPT_CHAT_API: {
      URL: "https://api.openai.com/v1/chat/completions",
      METHOD: "POST",
    },
    CHATGPT_PROMPT_API: {
      URL: "https://api.openai.com/v1/completions",
      METHOD: "POST",
    },
    TIMESTAMP_EXTRACT_REGEX: /\[(\d+)\]/g,
    TIMESTAMPARRAY_EXTRACT_REGEX: /\[(\d+(?:,\s*\d+)*)\]/g,
    TIMESTAMPRANGE_EXTRACT_REGEX: /\[(\d+)-(\d+)\]/g,
    ...(await getEnvironmentVariables()),
  };
}

function getYouTubeConfigObject() {
  return {
    DETAILED_CAPTION_TIMESTAMPS: false,

    // 1 token ~= 3 chars in English
    TOKEN_MAX: 3900,
    TOKEN_RETRY_DESCREASE_VALUE: 300,

    YOUTUBE_API: {
      URL: "https://www.youtube.com/watch?v=",
      METHOD: "GET",
    },
    CAPTION_EXTRACT_REGEX: /"captionTracks":\[\{"baseUrl":"(.*?)"/,
    VIDEOID_EXTRACT_REGEX: /[?&]v=([^&]+)/,
  };
}
