const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  globalShortcut,
  systemPreferences,
} = require("electron");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const OpenAI = require("openai");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");
const FormData = require("form-data");
const { exec } = require("child_process");
const { nodewhisper } = require("nodejs-whisper");
const { createAudioFile } = require("simple-tts-mp3");
const {
  handleAudio,
  onShortCutTriggered,
  handle2SecAudio,
  getModel,
} = require("./audio");
const { setup } = require("./setup");
const { keyboardShortcut } = require("./constants");
const { mainWindow } = require("./ui");

ffmpeg.setFfmpegPath(ffmpegStatic);

// // //  SET CONFIGS AND PLACEHOLDER VARIABLES // // //

// Recorded audio gets passed to this function when the microphone recording has stopped
ipcMain.on("audio-chunks", (event, audioChunks) => {
  handleAudio(audioChunks);
});

ipcMain.on("audio-chunk", (event, audioChunk, sentChunksCount) => {
  handle2SecAudio(audioChunk, sentChunksCount);
});

// Run when Electron app is ready
app.whenReady().then(async () => {
  await getModel();
  setup();

  globalShortcut.register(keyboardShortcut, onShortCutTriggered);
});
