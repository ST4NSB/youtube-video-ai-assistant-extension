async function main() {
  try {
    const config = getMainConfig();
    const videoId = getYoutubeVideoId();
    if (videoId === null) {
      throw new Error("Couldn't fetch videoId.");
    }

    const captions = await getYoutubeVideoCaptionBuckets(videoId);
    if (config.DEBUG) {
      console.log("YouTube-VideoID:", videoId);
      console.log("YouTube-Captions:", captions);
    }

    renderChatBox();
    const button = document.getElementById("send-to-chat");
    button.addEventListener("click", async () => {
      try {
        const question = document.getElementById("input-text").value;

        if (!question) {
          return;
        }

        const response = await getChatGptAnswer(videoId, question, captions);
        if (config.DEBUG) {
          console.log("ChatGPT response:", response);
        }

        const responseTextArea = document.getElementById("chat-response");
        responseTextArea.innerHTML = response;
      } catch (err) {
        const msg = `Error: ${err} in YouTube captions AI assistant, id: send-to-chat - Event Listener.`;
        console.error(msg);
        alert(msg);
      }
    });
  } catch (err) {
    const msg = `Error: ${err} in YouTube captions AI assistant, main_page.js.`;
    console.error(msg);
    alert(msg);
  }
}

window.onload = function () {
  main();
};
