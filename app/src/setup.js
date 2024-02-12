const { systemPreferences } = require("electron");
const { handleAPIKey } = require("./apiKey");
const { createMainWindow, createNotificationWindow } = require("./ui");

const askForMicroPhonePermission = async () => {
  systemPreferences
    .askForMediaAccess("microphone")
    .then((accessGranted) => {
      if (accessGranted) console.log("Microphone access granted");
      else console.log("Microphone access denied");
    })
    .catch((err) => {
      console.error("Error requesting microphone access:", err);
    });
};

const setup = () => {
  createMainWindow();
  createNotificationWindow();
  askForMicroPhonePermission();
  handleAPIKey();
};

module.exports = {
  setup,
};
