async function getChatGptAnswer(question, captionBuckets) {
  const config = await getChatGptConfigObject();
  let answers = [];
  for (let i = 0; i < captionBuckets.length; i++) {
    const bodyMessage = formatChatGptCaptionBody(
      question,
      captionBuckets[i],
      config
    );

    const response = await getChatGptResponse(bodyMessage, config);
    answers = [...answers, response];
  }

  if (answers.length > 1) {
    const answersBody = formatChatGptAnswersBody(answers, config);
    return await getChatGptResponse(answersBody, config);
  }

  return answers[0];
}

function formatChatGptAnswersBody(answers, config) {
  let messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. You will have some ChatGpt responses and you have to combine them in a single useful response. Don't mention you are combining them.",
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
      content: "Provide an useful combined response.",
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
        "You are a helpful assistant.You will get a few youtube captions in the format timestamp and message like 00:02:13.080|message.After that, a QUESTION will be provided.",
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
      role: "user",
      content: `QUESTION:${question}`,
    },
    {
      role: "user",
      content:
        "IMPORTANT:Answer the QUESTION including the timestamp if possible",
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
