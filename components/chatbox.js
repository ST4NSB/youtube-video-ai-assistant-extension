function renderChatBox() {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter text here";
  input.id = "input-text";

  const button = document.createElement("button");
  button.innerHTML = "Send";
  button.id = "send-to-chat";

  const response = document.createElement("div");
  response.placeholder = "Server response";
  response.id = "chat-response";
  response.readOnly = true;

  const container = document.createElement("div");
  container.appendChild(input);
  container.appendChild(button);
  container.appendChild(response);

  const youtubeComponent = document.getElementById("above-the-fold");
  youtubeComponent.appendChild(container);
}
