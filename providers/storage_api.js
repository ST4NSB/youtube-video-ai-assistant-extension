async function getChatGPTMessageHistory() {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.get("ChatGPTMessageHistory", function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.ChatGPTMessageHistory || {});
      }
    });
  });
}

async function getAllQuestionPairs(videoId) {
  const messageHistory = await getChatGPTMessageHistory();
  const reversedArray = [...(messageHistory[videoId] || [])].reverse();
  return reversedArray;
}

async function saveQuestionPair(videoId, question, answer) {
  const messageHistory = await getChatGPTMessageHistory();
  messageHistory[videoId] = [
    ...(messageHistory[videoId] || []),
    {
      question: question,
      answer: answer,
    },
  ];

  chrome.storage.local.set(
    { ChatGPTMessageHistory: messageHistory },
    function () {}
  );
}

async function removeQuestionPairs(videoId) {
  const messageHistory = await getChatGPTMessageHistory();
  if (videoId in messageHistory) {
    delete messageHistory[videoId];
    chrome.storage.local.set(
      { ChatGPTMessageHistory: messageHistory },
      function () {}
    );
  }
}
