const preCaptionContent = [
  {
    role: "system",
    content:
      "You are a helpful assistant.You will get a title and a few youtube captions in the format: timestamp message.After that,a question will be provided by the user.",
  },
  {
    role: "system",
    content:
      "In some cases, some previous questions & answers will be provided by the user, use them if necessary to get more context about the current question.",
  },
];

const postCaptionContent = async (videoId, question) => [
  {
    role: "system",
    content:
      "Answer the question including the timestamp, ONLY IF it's relevant to include it.",
  },
  {
    role: "system",
    content:
      "IMPORTANT:Any timestamp provided should be included in square brackets like: [480].",
  },
  ...(await loadPreviousContext(videoId, "user")),
  {
    role: "user",
    content: `The question is:${question}`,
  },
];

const preAnswersContent = [
  {
    role: "system",
    content:
      "You are a helpful assistant. You will have some computed results, these are for the SAME YOUTUBE VIDEO but different parts in the video.",
  },
  {
    role: "system",
    content:
      "You will have to combine them in a single useful response that will answer the user's question.",
  },
  {
    role: "system",
    content:
      "In some cases, some previous questions & answers will be provided by the user, use them if necessary to get more context about the current question.",
  },
];

const postAnswersContent = async (videoId, question) => [
  {
    role: "user",
    content:
      "IMPORTANT: Answer the question including the timestamp, ONLY IF it's relevant, in the same format it was given by the computed results.",
  },
  ...(await loadPreviousContext(videoId, "user")),
  {
    role: "user",
    content: `Provide an useful answer, by combining the computed results, to answer this question: ${question}`,
  },
];

// --------------------------------------------------------------------

async function getChatGptAnswer(videoId, question, captionBuckets) {
  const config = getMainConfig();

  let answers = [];
  for (let i = 0; i < captionBuckets.length; i++) {
    const requestBody = await createAIRequestBody(
      videoId,
      question,
      preCaptionContent,
      captionBuckets[i],
      postCaptionContent
    );

    const response = await getAIResponse(requestBody);
    if (config.DEBUG) {
      console.log(`UNEDITED AI assistant - ResponseNr ${i}: ${response}`);
    }

    if (captionBuckets.length > 1) {
      let chatBotMessageBox = document.getElementById("chat-response");
      chatBotMessageBox.innerHTML = `Loading AI assistant answers ... Loaded [${
        i + 1
      }/${captionBuckets.length + 1}]`;
    }

    answers = [...answers, response];
  }

  if (answers.length > 1) {
    const answersRequestBody = await createAIRequestBody(
      videoId,
      question,
      preAnswersContent,
      answers.map((answer, i) => `Computed Result #${i + 1}: ${answer}`),
      postAnswersContent
    );
    const answer = await getAIResponse(answersRequestBody);
    await saveQuestionPair(videoId, question, answer);
    return await formatChatGptFinalResponse(videoId, answer);
  }

  await saveQuestionPair(videoId, question, answers[0]);
  return await formatChatGptFinalResponse(videoId, answers[0]);
}

async function formatChatGptFinalResponse(videoId, response) {
  const chatGptConfig = await getAIConfigObject();
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
    function (match, p1, p2) {
      return `${anchorTag(p1)} - ${anchorTag(p2)}`;
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

async function createAIRequestBody(
  videoId,
  question,
  preContentArray,
  contentArray,
  postContentArray
) {
  const config = await getAIConfigObject();

  if (config.AI_MODE === 1) {
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
      model: config.AI_MODEL,
      messages: messages,
      options: {
        temperature: config.AI_TEMPERATURE,
      },
      stream: false,
    };
  } else if (config.AI_MODE === 2) {
    let prompt = preContentArray.map((msg) => msg.content).join("");

    for (let i = 0; i < contentArray.length; i++) {
      let caption = contentArray[i];
      prompt += `${caption}.`;
    }

    const postContent = (await postContentArray(videoId, question)) || [];
    prompt += postContent.map((msg) => msg.content).join("");

    return {
      model: config.AI_MODEL,
      prompt: prompt,
      options: {
        temperature: config.AI_TEMPERATURE,
      },
      stream: false,
    };
  }

  throw new Error("Unsupported AI Mode.");
}

async function getAIResponse(body) {
  const config = await getAIConfigObject();

  if (config.AI_MODE === 1) {
    const response = await getHttpResponse(
      config.AI_CHAT_API.URL,
      config.AI_CHAT_API.METHOD,
      body
    );

    return response.message.content;
  } else if (config.AI_MODE === 2) {
    const response = await getHttpResponse(
      config.AI_PROMPT_API.URL,
      config.AI_PROMPT_API.METHOD,
      body
    );

    return response.response;
  }

  throw new Error("Unsupported AI Mode.");
}

async function getHttpResponse(url, method, body, token = null) {
  const config = getMainConfig();
  if (config.DEBUG) {
    console.log(`[${method}]Request to ${url} - body: ${JSON.stringify(body)}`);
  }

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: token !== null ? `Bearer ${token}` : null,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      `Request failed with status ${
        response.status
      }. Error data: ${JSON.stringify(errorData)}.`
    );
  }

  const data = await response.json();
  if (config.DEBUG) {
    console.log(
      `[${method}]Response from ${url} - response: ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function loadPreviousContext(videoId, role) {
  const config = await getAIConfigObject();
  const messageHistory = await getChatGPTMessageHistory();
  const questions = [...(messageHistory[videoId] || [])].reverse();
  const filteredQuestions = questions.filter(
    (pair, i) => i < config.PREVIOUS_CONTEXT_LIMIT
  );

  if (filteredQuestions.length === 0) return [];
  const results = filteredQuestions
    .map((pair) => ({
      role: role,
      content: `previous question asked by user:${
        pair.question
      },previous answer given by the AI assistant:${pair.answer.substring(
        0,
        config.ANSWER_LIMIT
      )}.`,
    }))
    .reverse();

  return results;
}
