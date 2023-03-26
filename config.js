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

async function getChatGptConfigObject() {
  return {
    CHATGPT_MODE: 1, // 1 - CHATGPT_CHAT_URL, 2 - CHATGPT_PROMPT_URL
    CHATGPT_CHAT_API: {
      URL: "https://api.openai.com/v1/chat/completions",
      METHOD: "POST",
    },
    CHATGPT_PROMPT_API: {
      URL: "https://api.openai.com/v1/completions",
      METHOD: "POST",
    },
    CHATGPT_MODEL: "gpt-3.5-turbo",
    CHATGPT_TEMPERATURE: 0.16,

    ...(await getEnvironmentVariables()),
  };
}

function getYouTubeConfigObject() {
  return {
    YOUTUBE_API: {
      URL: "https://www.youtube.com/watch?v=",
      METHOD: "GET",
    },
    CAPTIONS_TOKEN_MAX_SIZE: 3800,
    CAPTION_EXTRACT_REGEX: /"captionTracks":\[\{"baseUrl":"(.*?)"/,
  };
}
