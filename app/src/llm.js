const { OpenAI } = require("openai");
const { getState, addMessage } = require("./state");

let openai;
const setUpOpenai = () => {
  const openAiApiKey = getState().apiKey;
  if (openAiApiKey) {
    openai = new OpenAI({
      modelName: "gpt-3.5-turbo",
      apiKey: openAiApiKey,
    });
  }
};

const callLlm = async (text) => {
  setUpOpenai();
  const userMessage = { role: "user", content: text };
  addMessage(userMessage);

  console.log(getState().conversationHistory);
  try {
    const response = await openai.chat.completions.create({
      max_tokens: 850,
      model: "gpt-3.5-turbo",
      messages: getState().conversationHistory,
    });
    console.log(response);
    const responseContent = response.choices[0].message.content;
    addMessage({ role: "assistant", content: responseContent });

    return responseContent;
  } catch (error) {
    console.log(error);
    // return null to show error message to user
    return null;
  }
};

module.exports = { callLlm };
