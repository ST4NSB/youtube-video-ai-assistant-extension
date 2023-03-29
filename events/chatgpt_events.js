async function renderChatGptEventListeners(videoId, captions) {
  const button = document.getElementById("send-to-chat");
  button.addEventListener("click", async () => {
    await askChatGPT(videoId, captions);
  });

  const textInput = document.getElementById("input-text");
  textInput.addEventListener("keypress", async () => {
    if (event.keyCode === 13) {
      await askChatGPT(videoId, captions);
    }
  });

  const historyPanel = document.getElementById("menu-history");
  historyPanel.addEventListener("click", async () => {
    const questionsHistory = document.getElementById("questions-history");
    questionsHistory.classList.toggle("hidden-component");
  });

  const deleteHistory = document.getElementById("delete-history");
  deleteHistory.addEventListener("click", async () => {
    await removeQuestionPairs(videoId);
    const messages = document.getElementById("questions-history");
    while (messages.firstChild) {
      messages.removeChild(messages.firstChild);
    }
  });
}

async function askChatGPT(videoId, captions) {
  try {
    const config = getMainConfig();
    const question = document.getElementById("input-text").value;

    if (!question) {
      return;
    }

    const textInput = document.getElementById("input-text");
    const sendButton = document.getElementById("send-to-chat");
    const chatBotMessageBox = document.getElementById("chat-response");
    textInput.disabled = true;
    sendButton.disabled = true;
    chatBotMessageBox.innerHTML = "Loading ChatGPT answer ...";

    const response = await getChatGptAnswer(videoId, question, captions);
    await saveQuestionPair(videoId, question, response);

    textInput.disabled = false;
    sendButton.disabled = false;
    chatBotMessageBox.innerHTML = response;

    createChatConversation([
      {
        question: question,
        answer: response,
      },
    ]);

    if (config.DEBUG) {
      console.log("ChatGPT response:", response);
    }
  } catch (err) {
    const msg = `Error: ${err} in YouTube captions AI assistant, id: send-to-chat - Event Listener.`;
    console.error(msg);
    alert(msg);
  }
}
