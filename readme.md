# Otto: your personal mac AI assistant

Heavily inspired by [macOSpilot](https://github.com/elfvingralf/macOSpilot-ai-assistant)

Otto is a personal assistant for macOS that uses a local Whisper model to transcribe audio, listen for wake words, and answer questions using OpenAI's GPT-3. It's designed to be a simple, easy-to-use, privacy-focused, and extensible alternative to Siri, Alexa, and other voice assistants.

- **Trigger with keyboard shortcut or your voice, speak your question:** Say "Hey Otto" or hit CMD + SHIFT + ' to trigger the assistant, then ask your question. You can also type your question if you prefer.

- **Natural conversation:** The assistant is fast, and pauses after answering for you to ask follow-up questions. The process feels natural, like a human-to-human conversation. It also remembers context from previous questions, so you can ask follow-up questions without repeating the context.

### Install

Make sure you have NodeJS installed on your machine. Then clone the repo and follow the steps below.

```bash

git  clone  https://github.com/elfvingralf/macOSpilot-ai-assistant.git

```

Navigate to the folder and run `yarn install` or `npm install` in your folder. This should install all dependencies.

Run `yarn start` or `npm start`. Because the application needs access to read your screen, microphone, read/write files etc, you will need to go through the steps of granting it access and possibly restarting your terminal.

### Configurations

Make sure to add your OpenAI API key by clicking the settings icon in the top right-hand corner of the main window. (it's not stored encrypted!)

If you want to change the default values here's a few things that might be worth changing, all in `index.js`:

### Turn it into an .app with Electron

Want to create an .app executable instead of running this from your terminal?

First go to `index.js` and change `const useElectronPackager` from `false` to `true`.

Run one of these in your terminal, depending on which platform you're on.

```bash
npm  run  package-mac
npm  run  package-win
npm  run  package-linux
```

Note I have only tested this on Mac (Apple silicon and Intel).

Go to `/release-builds/` in your project folder, and chose the folder of your platform. In there is an executable, `.app` if you're on Mac. Double-click it to open the app, note that it may take a few seconds the first time so be patient.

Once the app is opened, trigger your keyboard shortcut. You'll be asked to grant Privacy & Security permissions. You may need to repeat this another one or two times for all permissions to work properly, and to restart the app.

## Improvements:

Some improvements I'd like to make, in no particular order:

- Make wake word detection more efficient - using whisper is overkill probably
- Let model think in the background and start conversations on it's own
- Make the UI more user-friendly
- Integrate with search engines
- Integrate with local files (main use case is managing obsidian notes)
