const fs = require("fs");
const { LocalFileStore } = require("langchain/storage/file_system");
const {
  AIMessage,
  HumanMessage,
  SystemMessage,
} = require("@langchain/core/messages");

// Instantiate the store using the `fromPath` method.
const store = await LocalFileStore.fromPath("./chatHistory");
// Define our encoder/decoder for converting between strings and Uint8Arrays
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const messagesPrefix = "message:";
const thoughtsPrefix = "thought:";

const addThoughtToStore = async (thought) => {
  await addMessageToStore(thought, "ai", thoughtsPrefix);
};

const addMessageToStore = async (
  message,
  type = "human",
  prefix = messagesPrefix
) => {
  if (type === "human") {
    message = new HumanMessage({ content: message });
  } else if (type === "ai") {
    message = new AIMessage({ content: message });
  } else if (type === "system") {
    message = new SystemMessage({ content: message });
  } else {
    throw new Error("Invalid message type");
  }

  await store.set([
    `${messagesPrefix}${Date.now()}`,
    encoder.encode(JSON.stringify(message)),
  ]);
};

const getAllMessageKeys = async () => await store.yieldKeys(messagesPrefix);
const getAllMessages = async () => {
  const allMessageKeys = await getAllMessageKeys();
  return await store.mget(allMessageKeys);
};
const getLast10Messages = async () => {
  const allMessageKeys = await getAllMessageKeys();
  const last10MessageKeys = allMessageKeys.slice(-10);
  return await store.mget(last10MessageKeys);
};

const getAllThoughtKeys = async () => await store.yieldKeys(thoughtsPrefix);
const getAllThoughts = async () => {
  const allThoughtKeys = await getAllThoughtKeys();
  return await store.mget(allThoughtKeys);
};
const getLast10Thoughts = async () => {
  const allThoughtKeys = await getAllThoughtKeys();
  const last10ThoughtKeys = allThoughtKeys.slice(-10);
  return await store.mget(last10ThoughtKeys);
};

module.exports = {
  addThoughtToStore,
  addMessageToStore,
  getAllMessages,
  getLast10Messages,
  getAllThoughts,
  getLast10Thoughts,
};
