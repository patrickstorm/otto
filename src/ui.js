const { BrowserWindow } = require("electron");

const notificationWindowWidth = 300; // Width of notification window
const notificationWindowHeight = 100; // Height of notification window
const notificationOpacity = 0.8; // Opacity of notification window
const mainWindowWidth = 600; // Width of main window
const mainWindowHeight = 400; // Height of main window

let mainWindow;
let notificationWindow;

// Create main Electron window
const createMainWindow = async () => {
  mainWindow = new BrowserWindow({
    width: mainWindowWidth,
    height: mainWindowHeight,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  await mainWindow.loadFile("ui/index.html");
  console.log("mainWindow");
  mainWindow.webContents.send("init-mediaRecorder");
  console.log("sent");
};

// Create "always on top" Electron notification window
const createNotificationWindow = () => {
  notificationWindow = new BrowserWindow({
    width: notificationWindowWidth,
    height: notificationWindowHeight,
    frame: false,
    transparent: true, // Enable transparency
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    alwaysOnTop: true,
    skipTaskbar: true,
    x: 0,
    y: 0,
  });
  notificationWindow.setOpacity(notificationOpacity);
  notificationWindow.loadFile("ui/notifications.html");
};

// Function to push new text to the notification window
const updateNotificationWindowText = (textToDisplay) => {
  // If the window has been closed by the user, create a new one
  if (!notificationWindow) createNotificationWindow();
  notificationWindow.webContents.send(
    "update-notificationWindow-text",
    textToDisplay
  );
};

module.exports = {
  createMainWindow,
  createNotificationWindow,
  updateNotificationWindowText,
  getMainWindow: () => mainWindow,
  getNotificationWindow: () => notificationWindow,
};
