const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");
const { exec } = require("child_process");
const { createAudioFile } = require("simple-tts-mp3");
const { Whisper, manager } = require("smart-whisper");
const { decode } = require("node-wav");

const {
  micRecordingFilePath,
  wavFilePath,
  micShortRecordingFilePath,
  wavShortFilePath,
} = require("./constants");
const { callLlm } = require("./llm");
const { getState, setState } = require("./state");
const {
  createNotificationWindow,
  getMainWindow,
  getNotificationWindow,
  updateNotificationWindowText,
} = require("./ui");
const { get } = require("http");
const path = require("path");

const WAKE_WORDS = ["hey auto", "hey otto"];
let whisper = null;

const handleAudio = async (audioBuffer) => {
  fs.writeFile(micRecordingFilePath, audioBuffer, (err) => {
    if (err) {
      console.error("Failed to save temporary audio file:", err);
      return;
    }

    try {
      ffmpeg(micRecordingFilePath)
        .setFfmpegPath(ffmpegStatic)
        .audioFrequency(16000) //
        .toFormat("wav")
        .on("error", (err) => {
          console.error("Error converting to MP3:", err);
        })
        .on("end", async () => {
          fs.unlink(micRecordingFilePath, (err) => {
            if (err) console.error("Failed to delete temporary file:", err);
          });
          // Send user audio recording to OpenAI Whisper API for transcription
          const transcribedText = await transcribeUserRecording(wavFilePath);
          // Call OpenAI Vision API with transcribed text
          if (transcribedText) {
            if (isEmptyRecording(transcribedText, false)) {
              // Do nothing for now
            } else {
              processTranscribedText(transcribedText);
              getMainWindow().webContents.send(
                "display-on-both-windows",
                "Ask me anything..."
              );
              updateNotificationWindowText("Ask me anything...");
            }
          } else {
            // Show error message if the transcrition failled.
            // Future improvement: refactor this to use general call instead of "display-on-both-windows",
            getMainWindow().webContents.send(
              "display-on-both-windows",
              "There was an error transcribing your recording"
            );

            updateNotificationWindowText(
              "There was an error transcribing your recording"
            );
          }
        })
        .save(wavFilePath);
    } catch (error) {
      console.log(error);
    }
  });
};

const isEmptyRecording = (transcribedText, withDone) => {
  return (
    !transcribedText ||
    (withDone && transcribedText.match(/done\W*$/i)) ||
    transcribedText.match(/\[BLANK_AUDIO\]/i) ||
    transcribedText.match(/\[SOUND\]/i) ||
    !transcribedText.trim() ||
    transcribedText.match(/\(clicking\)/i) ||
    transcribedText.match(/\(birds chirping\)/i)
  );
};

let recordingVoiceStarted = false;
let numChunksInRecording = 0;

// This is a function to determine if we are done talking,
// and if so, send the the stop recording event
const handle2SecAudio = (audioBuffer) => {
  if (getState().isRecording) numChunksInRecording++;
  fs.writeFile(micShortRecordingFilePath, audioBuffer, (err) => {
    if (err) {
      console.error("Failed to save temporary audio file:", err);
      return;
    }

    // Convert the temporary file to MP3 and send to Vision API
    try {
      ffmpeg(micShortRecordingFilePath)
        .setFfmpegPath(ffmpegStatic)
        .audioFrequency(16000) //
        .toFormat("wav")
        .on("error", (err, stdout, stderr) => {
          if (err) console.error("Ffmpeg error:", err);
          if (stdout) console.log("ffmpeg stdout:\n" + stdout);
          if (stderr) console.log("ffmpeg stderr:\n" + stderr);
        })
        .on("end", async () => {
          fs.unlink(micShortRecordingFilePath, (err) => {
            if (err) console.error("Failed to delete temporary file:", err);
          });
          // Send user audio recording to OpenAI Whisper API for transcription
          const transcribedText = await transcribeUserRecording(
            wavShortFilePath
          );

          if (getState().isRecording) {
            if (
              recordingVoiceStarted &&
              isEmptyRecording(transcribedText, true)
            ) {
              console.log("-- ENDING");
              // If transcribed text is empty or ends with the word "done"
              // If the user is done talking, stop the recording
              onShortCutTriggered();
            } else if (
              !recordingVoiceStarted &&
              !isEmptyRecording(transcribedText)
            ) {
              console.log("-- STARTED", transcribedText);
              recordingVoiceStarted = true;
            }
          } else if (!getState().isSpeaking) {
            // If we aren't recording, see if wake word said.
            const transcribedTextWithoutPunctuation = transcribedText.replace(
              /[.,\/#!$%\^&\*;:{}=\-_`~()]/g,
              ""
            );
            const hasWakeWord = WAKE_WORDS.some((word) =>
              transcribedTextWithoutPunctuation.toLowerCase().includes(word)
            );
            if (hasWakeWord) onShortCutTriggered();
          } else if (getState().isSpeaking) {
            // list for an interruption
            if (transcribedText.toLowerCase().includes("stop")) {
              console.log("-- ENDING due to stop");
              onShortCutTriggered();
            }
          }
          fs.unlink(wavShortFilePath, (err) => {
            if (err) console.error("Failed to delete temporary file:", err);
          });
        })
        .save(wavShortFilePath);
    } catch (error) {
      console.log(error);
    }
  });
};

const onShortCutTriggered = async () => {
  recordingVoiceStarted = false;
  numChunksInRecording = 0;
  // If the microphone recording isn't already running
  if (!getState().isRecording) {
    if (!getNotificationWindow()) {
      createNotificationWindow();
    }

    const responseMessage = `...`;
    getMainWindow().webContents.send("add-window-name-to-app", responseMessage);
    updateNotificationWindowText(responseMessage);

    getMainWindow().webContents.send("start-recording");
    getNotificationWindow().webContents.send("start-recording");
    setState({ ...getState(), isRecording: true });
  } else {
    // If we're already recording, the keyboard shortcut means we should stop
    getMainWindow().webContents.send("stop-recording");
    getNotificationWindow().webContents.send("stop-recording");
    setState({ ...getState(), isRecording: false });
  }
};

// Function to send user inputs to OpenAI Vision API and display/play response
const processTranscribedText = async (questionInput) => {
  let llmResponse = await callLlm(questionInput);

  // If the Vision API response failed it will be null, set error message
  llmResponse =
    llmResponse ?? "There was an error calling the OpenAI Vision API";

  // Update both windows with the response text (refactor this)
  getMainWindow().webContents.send("display-on-both-windows", llmResponse);
  updateNotificationWindowText(llmResponse);

  // Call function to generate and playback audio of the LLM response
  await speakLlmResponse(llmResponse);
};

// Function that takes text input, calls TTS API, and plays back the response audio
const speakLlmResponse = async (inputText) => {
  const fileName = `${Date.now()}`;
  // get absolute path to audios folder
  const absolutePath = `${__dirname}/../audios/${fileName}`;
  try {
    setState({ ...getState(), isSpeaking: true });
    const filePath = await createAudioFile(inputText, absolutePath);
    const playCommand = `afplay "${filePath}"`;
    exec(playCommand, (error) => {
      if (error) {
        console.error("Failed to play audio:", error);
      } else {
        // wait 500ms and start-recording
        setTimeout(() => {
          getMainWindow().webContents.send("start-recording");
          getNotificationWindow().webContents.send("start-recording");
          setState({ ...getState(), isRecording: true });
        }, 500);
      }
      setState({ ...getState(), isSpeaking: false });
    });
  } catch (error) {
    setState({ ...getState(), isSpeaking: false });
    console.log(error);
  }
};

// Function to send audio file of user recording and return a transcription
const transcribeUserRecording = async (wavFilePath) => {
  try {
    return await sendToWhisper(wavFilePath);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return false;
  }
};

const getModel = async (modelName = "tiny.en") => {
  const modelExists = manager.check(modelName);
  if (!modelExists) {
    console.log("Whisper model doesn't existsSync, downloading");
    await manager.download(modelName);
  }
  const resolved = manager.resolve(modelName);
  return resolved;
};

function read_wav(file) {
  const { sampleRate, channelData } = decode(fs.readFileSync(file));

  if (sampleRate !== 16000) {
    throw new Error(`Invalid sample rate: ${sampleRate}`);
  }
  if (channelData.length !== 1) {
    throw new Error(`Invalid channel count: ${channelData.length}`);
  }

  return channelData[0];
}

const sendToWhisper = async (wavFilePath) => {
  if (!whisper) {
    const model = await getModel();
    whisper = new Whisper(model, { gpu: true });
  }
  const wav = wavFilePath;
  const pcm = read_wav(wav);
  const task = await whisper.transcribe(pcm, {
    language: "en",
  });
  const result = await task.result;
  console.log("result: ", result[0].text);
  // await whisper.free();
  return result[0].text;
};

module.exports = {
  handleAudio,
  onShortCutTriggered,
  speakLlmResponse,
  transcribeUserRecording,
  handle2SecAudio,
};
