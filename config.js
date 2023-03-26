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

async function getConfigObject() {
  return {
    CHATGPT_CHAT_URL: "https://api.openai.com/v1/chat/completions",
    CHATGPT_PROMPT_URL: "https://api.openai.com/v1/completions",
    CHATGPT_MODE: 1, // 1 - CHATGPT_CHAT_URL, 2 - CHATGPT_PROMPT_URL
    TOKEN_MAX_SIZE: 3500,

    ...(await getEnvironmentVariables()),
  };
}
