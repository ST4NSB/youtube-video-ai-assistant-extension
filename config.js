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
    CHATGPT_MODEL: "gpt-3.5-turbo",
    CHATGPT_TEMPERATURE: 0.62,

    CHATGPT_MODE: 1, // 1 - CHATGPT_CHAT_URL, 2 - CHATGPT_PROMPT_URL
    CHATGPT_CHAT_API: {
      URL: "https://api.openai.com/v1/chat/completions",
      METHOD: "POST",
    },
    CHATGPT_PROMPT_API: {
      URL: "https://api.openai.com/v1/completions",
      METHOD: "POST",
    },

    TIMESTAMP_EXTRACT_REGEX: /[tT]imestamp\s(\d+)/g,
    ...(await getEnvironmentVariables()),
  };
}

function getYouTubeConfigObject() {
  return {
    // the number of allowed caption sentences with the format: timestamp|message
    CAPTIONS_SENTENCES_MAX_SIZE: 200,
    DETAILED_CAPTION_TIMESTAMPS: false,

    YOUTUBE_API: {
      URL: "https://www.youtube.com/watch?v=",
      METHOD: "GET",
    },

    CAPTION_EXTRACT_REGEX: /"captionTracks":\[\{"baseUrl":"(.*?)"/,
    VIDEOID_EXTRACT_REGEX: /[?&]v=([^&]+)/,
  };
}
