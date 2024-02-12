const path = require("path");
const fs = require("fs");
const { getState } = require("./state");

const useElectronPackager = false;
let tempFilesDir;
// This decides what directory/storage strategy to use (local project or application folder)
if (useElectronPackager) {
  tempFilesDir = path.join(app.getPath("userData"), "macOSpilot-temp-files");
} else {
  tempFilesDir = path.join(__dirname, "../macOSpilot-temp-files");
}

if (!fs.existsSync(tempFilesDir)) {
  fs.mkdirSync(tempFilesDir, { recursive: true });
}

const micRecordingFilePath = path.join(tempFilesDir, "macOSpilotMicAudio.raw");
const micShortRecordingFilePath = path.join(
  tempFilesDir,
  "macOSpilotMicAudioShort.raw"
);
const wavFilePath = path.join(tempFilesDir, "macOSpilotAudioInput.wav");
const wavShortFilePath = path.join(
  tempFilesDir,
  "macOSpilotAudioInputShort.wav"
);

const keyboardShortcut = "CommandOrControl+Shift+'"; // This is the keyboard shortcut that triggers the app

module.exports = {
  micRecordingFilePath,
  wavFilePath,
  keyboardShortcut,
  micShortRecordingFilePath,
  wavShortFilePath,
};
