async function getChatGptAnswer(videoId, question, captionBuckets) {
  const config = await getChatGptConfigObject();
  const mainConfig = getMainConfig();
  let answers = [];
  for (let i = 0; i < captionBuckets.length; i++) {
    const bodyMessage = formatChatGptCaptionBody(
      question,
      captionBuckets[i],
      config
    );

    const response = await getChatGptResponse(bodyMessage, config);
    if (mainConfig.DEBUG) {
      console.log(`Unfiltered ChatGPT Response-Nr ${i}: ${response}`);
    }

    answers = [...answers, response];
  }

  if (answers.length > 1) {
    const answersBody = formatChatGptAnswersBody(question, answers, config);
    const answer = await getChatGptResponse(answersBody, config);
    return await formatChatGptFinalResponse(videoId, answer);
  }

  return await formatChatGptFinalResponse(videoId, answers[0]);
}

async function formatChatGptFinalResponse(videoId, response) {
  const chatGptConfig = await getChatGptConfigObject();
  const youtubeConfig = getYouTubeConfigObject();

  const timestampRegex = new RegExp(chatGptConfig.TIMESTAMP_EXTRACT_REGEX);
  const matches = response.matchAll(timestampRegex);

  let formattedResponse = response;
  for (const match of matches) {
    const timestamp = match[1];
    formattedResponse = formattedResponse.replace(
      match[0],
      `<a href="${
        youtubeConfig.YOUTUBE_API.URL
      }${videoId}&t=${timestamp}">${parseCaptionTimeStampToYoutubeVideoTimeStamp(
        timestamp
      )}</a>`
    );
  }

  formattedResponse = formattedResponse.replace("\n", "<br>");
  return formattedResponse;
}

function parseCaptionTimeStampToYoutubeVideoTimeStamp(timestamp) {
  timestamp = timestamp + ".00";
  // Video start time (in seconds)
  const videoStart = 0;

  // Calculate the absolute start time (in seconds)
  const absoluteStart = timestamp + videoStart;

  // Convert the absolute start time to the video timestamp format
  const date = new Date(absoluteStart * 1000); // Convert to milliseconds
  const convertedTimestamp = date.toISOString().substr(11, 12);

  return convertedTimestamp;
}

function formatChatGptAnswersBody(question, answers, config) {
  let messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. You will have some ChatGpt responses and you have to combine them in a single useful response that will answer the user's question.",
    },
    {
      role: "system",
      content: "Do NOT mention you are combining the answers.",
    },
  ];

  for (let i = 0; i < answers.length; i++) {
    let answer = answers[i];
    messages = [
      ...messages,
      {
        role: "system",
        content: `Chat-GPT response number ${i + 1}: ${answer}`,
      },
    ];
  }
  messages = [
    ...messages,
    {
      role: "user",
      content: `Provide an useful answer to this question: ${question}`,
    },
  ];

  return {
    model: config.CHATGPT_MODEL,
    messages: messages,
    temperature: config.CHATGPT_TEMPERATURE,
  };
}

function formatChatGptCaptionBody(question, captionBucket, config) {
  let messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant.You will get a title and a few youtube captions in the format timestamp|message.After that,a QUESTION will be provided by the user.",
    },
  ];

  for (let i = 0; i < captionBucket.length; i++) {
    let caption = captionBucket[i];
    messages = [
      ...messages,
      {
        role: "system",
        content: caption,
      },
    ];
  }
  messages = [
    ...messages,
    {
      role: "system",
      content:
        "IMPORTANT 1:Answer the QUESTION including the timestamp, only if it's relevant, in the following format: timestamp 20",
    },
    {
      role: "system",
      content:
        "IMPORTANT 2:DO NOT include a list of timestamps,ALWAYS use individual timestamps",
    },
    {
      role: "system",
      content:
        "IMPORTANT 3:you can include end timestamps, but do NOT add hypen or dashes in the answer",
    },
    {
      role: "user",
      content: `QUESTION:${question}`,
    },
  ];

  return {
    model: config.CHATGPT_MODEL,
    messages: messages,
    temperature: config.CHATGPT_TEMPERATURE,
  };
}

async function getChatGptResponse(body, config) {
  if (config.CHATGPT_MODE === 1) {
    const response = await getFetchResponse(
      config.CHATGPT_CHAT_API.URL,
      config.CHATGPT_CHAT_API.METHOD,
      body,
      config.CHATGPT_KEY
    );
    return response.choices[0].message.content;
  } else if (config.CHATGPT_MODE === 2) {
    throw new Error("Unsupported ChatGPT Mode.");
  }

  return null;
}

async function getFetchResponse(url, method, body, token) {
  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return data;
}
