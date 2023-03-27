function renderChatBox() {
  const chatboxDiv = document.getElementById("chat-box");
  if (chatboxDiv) {
    chatboxDiv.remove();
  }

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Ask ChatGPT here";
  input.id = "input-text";

  const button = document.createElement("button");
  button.innerHTML = "SEND";
  button.id = "send-to-chat";

  const response = document.createElement("div");
  response.innerHTML = "ChatGPT will answer all your questions";
  response.id = "chat-response";
  response.readOnly = true;

  const textContainer = document.createElement("div");
  textContainer.id = "text-box";
  textContainer.appendChild(input);
  textContainer.appendChild(button);

  const mainContainer = document.createElement("div");
  mainContainer.id = "chat-box";
  mainContainer.appendChild(textContainer);
  mainContainer.appendChild(response);

  const youtubeComponent = document.getElementById("above-the-fold");
  youtubeComponent.appendChild(mainContainer);
}
