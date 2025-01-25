function renderChatBox() {
  const chatboxDiv = document.getElementById("chat-box");
  if (chatboxDiv) {
    chatboxDiv.remove();
  }

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Ask your AI assistant anything here..";
  input.id = "input-text";

  const button = document.createElement("button");
  button.innerHTML = "SEND";
  button.id = "send-to-chat";

  const response = document.createElement("div");
  response.innerHTML = null;
  response.id = "chat-response";
  response.style.display = "none";
  response.readOnly = true;

  const textContainer = document.createElement("div");
  textContainer.id = "text-box";
  textContainer.appendChild(input);
  textContainer.appendChild(button);

  const historyMenu = document.createElement("div");
  historyMenu.id = "menu-history";
  historyMenu.innerHTML = "AI assistant answers history - Click to toggle";

  const historyDelete = document.createElement("button");
  historyDelete.id = "delete-history";
  historyDelete.innerHTML = "DELETE";
  historyDelete.title = "Delete all AI assistant message history.";

  const historyBar = document.createElement("div");
  historyBar.id = "history-bar";
  historyBar.appendChild(historyMenu);
  historyBar.appendChild(historyDelete);

  const historyQuestions = document.createElement("div");
  historyQuestions.id = "questions-history";

  const historyContainer = document.createElement("div");
  historyContainer.id = "chat-history";
  historyContainer.appendChild(historyBar);
  historyContainer.appendChild(historyQuestions);

  const mainContainer = document.createElement("div");
  mainContainer.id = "chat-box";
  mainContainer.appendChild(textContainer);
  mainContainer.appendChild(response);
  mainContainer.appendChild(historyContainer);

  const youtubeComponent = document.getElementById("above-the-fold");
  youtubeComponent.appendChild(mainContainer);
}

async function createChatConversation(videoId, messageHistory) {
  const conversationFormat = async (question, answer) =>
    `<div class="qpair">
      <div class="question">
        <span class="user">YOU:</span>
        <span>${question}</span>
      </div>
      <div class="answer">
        <span class="chatgpt">AI assistant:</span>
        <span>${await formatChatGptFinalResponse(videoId, answer)}</span>
      </div>
    </div>`;

  let conversation = "";
  for (let i = 0; i < messageHistory.length; i++) {
    let message = messageHistory[i];
    conversation += await conversationFormat(message.question, message.answer);
  }

  const chatHistory = document.getElementById("questions-history");
  chatHistory.insertAdjacentHTML("afterbegin", conversation);
}
