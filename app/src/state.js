const Store = require("electron-store");
const store = new Store();

const state = {
  apiKey: store.get("userApiKey", ""),
  store,
  isRecording: false,
  isSpeaking: false,
  conversationHistory: [
    {
      role: "system",
      content:
        "You are my helpful assistant. You help me with any task I need. Please keep your answers very brief, unless specifically asked for more detail.",
    },
  ],
};

module.exports = {
  getState: () => state,
  setState: (newState) => {
    Object.assign(state, newState);
  },
  addMessage: (message) => {
    state.conversationHistory.push(message);
  },
};
