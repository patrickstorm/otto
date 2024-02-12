const { ipcRenderer } = require("electron");

let mediaRecorder;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

ipcRenderer.on("display-on-both-windows", (event, visionResponse) => {
  // Get the analysis container
  const analysisContainer = document.getElementById("analysis");
  updateWindowMessage(visionResponse);
});

ipcRenderer.on("push-question-to-windows", (event, questionText) => {
  updateWindowMessage(`${questionText} ... thinking...`);
});

let audioChunks = [];
let isRecording = false;
let firstChunk = null;
let curChunks = [];

// This triggers a 500 ms audio/microphone recording as soon as the app loads. It's a work-around to address an issue seen on some machines where the first audio recording doesn't work.
ipcRenderer.on("init-mediaRecorder", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start(200);

  mediaRecorder.addEventListener("dataavailable", async (event) => {
    if (event.data.size > 0) {
      if (!firstChunk) {
        firstChunk = event.data;
      } else {
        if (isRecording) audioChunks.push(event.data);
        curChunks.push(event.data);
      }
    }
    if (curChunks.length > 4) {
      const newSetOfChunks = [firstChunk, ...curChunks];
      const audioBlob = new Blob(newSetOfChunks, { type: "audio/wav" });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      ipcRenderer.send("audio-chunk", buffer);
      curChunks = curChunks.slice(-1);
    }
  });
});

ipcRenderer.on("start-recording", async () => {
  isRecording = true;
  audioChunks = [firstChunk];

  // play a sound to indicate recording has started
  const audio = new Audio("../assets/beep.mp3");
  audio.volume = 0.6;
  audio.play();
});

ipcRenderer.on("stop-recording", async () => {
  isRecording = false;
  updateWindowMessage("Processing...");
  const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
  const arrayBuffer = await audioBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  ipcRenderer.send("audio-chunks", buffer);
});

ipcRenderer.on("add-window-name-to-app", (event) => {
  const analysisContainer = document.getElementById("analysis");

  // Create a new section for this window
  const windowSection = document.createElement("div");
  windowSection.className = "window-section";

  const title = document.createElement("h3");
  title.textContent = `Speech incoming`;
  windowSection.appendChild(title);

  const message = document.createElement("div");
  message.className = "window-message";
  windowSection.appendChild(message);

  // Prepend the new section to the analysis container
  if (analysisContainer.firstChild) {
    analysisContainer.insertBefore(windowSection, analysisContainer.firstChild);
  } else {
    analysisContainer.appendChild(windowSection);
  }
  // }
});

function updateWindowMessage(message) {
  const latestWindowSection = document.querySelector(".window-section");
  if (latestWindowSection) {
    const messageDiv = latestWindowSection.querySelector(".window-message");
    if (messageDiv) {
      messageDiv.textContent = message;
    }
  }
}
