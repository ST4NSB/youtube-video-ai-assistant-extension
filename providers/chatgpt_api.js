const preCaptionContent = [
  {
    role: "system",
    content:
      "You are a helpful assistant.You will get a title and a few youtube captions in the format timestamp|message.After that,a QUESTION will be provided by the user.",
  },
  {
    role: "system",
    content:
      "In some cases, some PREVIOUS QUESTION & ANSWER will be provided by the user, use them if necessary to get more context about the current QUESTION.",
  },
];

const postCaptionContent = async (videoId, question) => [
  {
    role: "system",
    content:
      "IMPORTANT:Answer the QUESTION including the timestamp, only if it's relevant.",
  },
  {
    role: "system",
    content:
      "IMPORTANT:Any timestamp provided should be included in square brackets like: [10].",
  },
  ...(await loadPreviousContext(videoId, "system")),
  {
    role: "user",
    content: `QUESTION:${question}`,
  },
];

const preAnswersContent = [
  {
    role: "system",
    content:
      "You are a helpful assistant. You will have some ChatGpt responses and you have to combine them in a single useful response that will answer the user's question.",
  },
  {
    role: "system",
    content:
      "In some cases, some PREVIOUS QUESTION & ANSWER will be provided by the user, use them if necessary to get more context about the current QUESTION.",
  },
  {
    role: "system",
    content: "Do NOT mention you are combining the answers.",
  },
];

const postAnswersContent = async (videoId, question) => [
  ...(await loadPreviousContext(videoId, "system")),
  {
    role: "user",
    content: `Provide an useful answer to this question: ${question}`,
  },
];

// --------------------------------------------------------------------

async function getChatGptAnswer(videoId, question, captionBuckets) {
  const config = getMainConfig();

  let answers = [];
  for (let i = 0; i < captionBuckets.length; i++) {
    const requestBody = await createChatGptRequestBody(
      videoId,
      question,
      preCaptionContent,
      captionBuckets[i],
      postCaptionContent
    );

    const response = await getChatGptResponse(requestBody);
    if (config.DEBUG) {
      console.log(`Unfiltered ChatGPT Response-Nr ${i}: ${response}`);
    }

    answers = [...answers, response];
  }

  if (answers.length > 1) {
    const answersRequestBody = await createChatGptRequestBody(
      videoId,
      question,
      preAnswersContent,
      answers.map(
        (answer, i) => `Chat-GPT response number ${i + 1}: ${answer}`
      ),
      postAnswersContent
    );
    const answer = await getChatGptResponse(answersRequestBody);
    return await formatChatGptFinalResponse(videoId, answer);
  }

  return await formatChatGptFinalResponse(videoId, answers[0]);
}

async function formatChatGptFinalResponse(videoId, response) {
  const chatGptConfig = await getChatGptConfigObject();
  const youTubeVideoUrl = getYouTubeConfigObject().YOUTUBE_API.URL;

  const anchorTag = (number) =>
    `<a href="${youTubeVideoUrl}${videoId}&t=${number}">${parseCaptionTimeStampToYoutubeVideoTimeStamp(
      number
    )}</a>`;

  let formattedResponse = response.replace(/\n/g, "<br>");

  const timestampRegex = new RegExp(chatGptConfig.TIMESTAMP_EXTRACT_REGEX);
  const matches = response.matchAll(timestampRegex);

  for (const match of matches) {
    const timestamp = match[1];
    formattedResponse = formattedResponse.replace(
      match[0],
      anchorTag(timestamp)
    );
  }

  const arrTimestampsRegex = new RegExp(
    chatGptConfig.TIMESTAMPARRAY_EXTRACT_REGEX
  );
  formattedResponse = formattedResponse.replace(
    arrTimestampsRegex,
    (match, capture) => {
      const numbers = capture.split(/\s*,\s*/); // split the captured string into an array of numbers
      const anchors = numbers.map((number) => anchorTag(number)); // create an array of anchor tags for each number
      return `[${anchors.join(", ")}]`; // join the anchor tags with commas and return the final string inside square brackets
    }
  );

  formattedResponse = formattedResponse.replace(
    chatGptConfig.TIMESTAMPRANGE_EXTRACT_REGEX,
    (match, start, end) => {
      return `${anchorTag(start)}-${anchorTag(end)}`;
    }
  );

  return formattedResponse;
}

function parseCaptionTimeStampToYoutubeVideoTimeStamp(timestamp) {
  // Video start time (in seconds)
  const videoStart = 0;

  // Calculate the absolute start time (in seconds)
  const absoluteStart = timestamp + ".000" + videoStart;

  // Convert the absolute start time to the video timestamp format
  const date = new Date(absoluteStart * 1000); // Convert to milliseconds
  const convertedTimestamp = date
    .toISOString()
    .substr(11, 12)
    .replace(".000", "");

  if (convertedTimestamp.startsWith("00:")) {
    return convertedTimestamp.substring(3);
  }

  return convertedTimestamp;
}

async function createChatGptRequestBody(
  videoId,
  question,
  preContentArray,
  contentArray,
  postContentArray
) {
  const config = await getChatGptConfigObject();

  if (config.CHATGPT_MODE === 1) {
    let messages = [...preContentArray];

    for (let i = 0; i < contentArray.length; i++) {
      let content = contentArray[i];
      messages = [
        ...messages,
        {
          role: "system",
          content: content,
        },
      ];
    }

    messages = [...messages, ...(await postContentArray(videoId, question))];

    return {
      model: config.CHATGPT_MODEL,
      messages: messages,
      temperature: config.CHATGPT_TEMPERATURE,
    };
  } else if (config.CHATGPT_MODE === 2) {
    let prompt = preContentArray.map((msg) => msg.content).join("");

    for (let i = 0; i < contentArray.length; i++) {
      let caption = contentArray[i];
      prompt += `${caption}.`;
    }

    prompt += await postContentArray(videoId, question)
      .map((msg) => msg.content)
      .join("");

    return {
      model: config.CHATGPT_MODEL,
      prompt: prompt,
      temperature: config.CHATGPT_TEMPERATURE,
    };
  }

  throw new Error("Unsupported ChatGPT Mode.");
}

async function getChatGptResponse(body) {
  const config = await getChatGptConfigObject();

  if (config.CHATGPT_MODE === 1) {
    const response = await getHttpResponse(
      config.CHATGPT_CHAT_API.URL,
      config.CHATGPT_CHAT_API.METHOD,
      body,
      config.CHATGPT_KEY
    );
    return response.choices[0].message.content;
  } else if (config.CHATGPT_MODE === 2) {
    const response = await getHttpResponse(
      config.CHATGPT_PROMPT_API.URL,
      config.CHATGPT_PROMPT_API.METHOD,
      body,
      config.CHATGPT_KEY
    );
    return response.choices[0].text;
  }

  throw new Error("Unsupported ChatGPT Mode.");
}

async function getHttpResponse(url, method, body, token) {
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

async function loadPreviousContext(videoId, role) {
  const config = await getChatGptConfigObject();
  const messageHistory = await getChatGPTMessageHistory();
  const questions = [...(messageHistory[videoId] || [])].reverse();
  const filteredQuestions = questions.filter(
    (pair, i) => i < config.PREVIOUS_CONTEXT_LIMIT
  );

  if (filteredQuestions.length === 0) return [];
  const results = filteredQuestions
    .map((pair) => ({
      role: role,
      content: `PREVIOUS QUESTION:${pair.question},PREVIOUS ANSWER:${pair.answer}.`,
    }))
    .reverse();

  return results;
}
