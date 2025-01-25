let captions = null;
let previousVideoId = null;
let maxAllowedTokens = null;

async function renderChatGptEventListeners(videoId) {
  const button = document.getElementById("send-to-chat");
  button.addEventListener("click", async () => {
    await askChatGPT(videoId);
  });

  const textInput = document.getElementById("input-text");
  textInput.addEventListener("keypress", async () => {
    if (event.keyCode === 13) {
      await askChatGPT(videoId);
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

async function askChatGPT(videoId) {
  try {
    const config = getMainConfig();
    const youTubeConfig = getYouTubeConfigObject();
    const question = document.getElementById("input-text").value;

    if (!question) {
      return;
    }

    if (!captions || previousVideoId !== videoId) {
      previousVideoId = videoId;
      captions = await getYoutubeVideoCaptionBuckets(
        videoId,
        youTubeConfig.TOKEN_MAX
      );

      if (captions.length === 0) {
        throw new Error("Couldn't fetch the CAPTIONS of this video!");
      }

      if (config.DEBUG) {
        console.log("YouTube Captions - Loaded.");
      }
    }

    const textInput = document.getElementById("input-text");
    const sendButton = document.getElementById("send-to-chat");
    const chatBotMessageBox = document.getElementById("chat-response");
    textInput.disabled = true;
    sendButton.disabled = true;
    chatBotMessageBox.style.display = "block";
    chatBotMessageBox.innerHTML = "Loading AI assistant answer ...";

    if (!maxAllowedTokens) {
      maxAllowedTokens = youTubeConfig.TOKEN_MAX;
    }
    const retryTokenDecreaseValue = youTubeConfig.TOKEN_RETRY_DESCREASE_VALUE;
    let response = "";

    do {
      try {
        if (config.DEBUG) {
          console.log("YouTube-Captions:", captions);
        }
        response = await getChatGptAnswer(videoId, question, captions);
        break;
      } catch (responseErr) {
        if (responseErr.message === "context_length_exceeded") {
          maxAllowedTokens = maxAllowedTokens - retryTokenDecreaseValue;
          captions = await getYoutubeVideoCaptionBuckets(
            videoId,
            maxAllowedTokens
          );
        } else {
          throw new Error(responseErr);
        }
      }
    } while (true);

    textInput.disabled = false;
    sendButton.disabled = false;
    chatBotMessageBox.innerHTML = response;

    await createChatConversation(videoId, [
      {
        question: question,
        answer: response,
      },
    ]);

    if (config.DEBUG) {
      console.log("AI assistant FINAL response:", response);
    }
  } catch (err) {
    const msg = `Error: ${err.message} - YouTube Video - AI assistant, id: send-to-chat - Event Listener.`;
    console.error(msg);
    alert(msg);
  }
}
