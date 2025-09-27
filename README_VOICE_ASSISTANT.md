# 🎤 Voice Assistant "Rudra"

A Python 3 voice assistant with wake word detection, speech-to-text, Gemini AI integration, and text-to-speech.

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Edit .env file with your API keys
nano .env
```

Required API keys:
- **Picovoice Access Key**: Get from [Picovoice Console](https://console.picovoice.ai/)
- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 2. Install Dependencies
```bash
# Run setup script
python setup_voice_assistant.py

# Or install manually
pip install -r requirements.txt
```

### 3. Run Assistant
```bash
python voice_assistant.py
```

## 🎯 Usage

1. **Activation**: Say "hey rudra" (or "hey google" as fallback)
2. **Ask Question**: Speak your question (7 seconds recording)
3. **Get Response**: Rudra responds with voice and text
4. **Exit**: Say "thank you" to quit

## 📋 Features

- ✅ **Wake Word Detection**: Porcupine engine with custom "hey rudra" support
- ✅ **Audio Recording**: 7-second microphone capture saved as WAV
- ✅ **Speech-to-Text**: OpenAI Whisper (free, local) with fallback recognition
- ✅ **Gemini AI**: Integration with Google Generative AI
- ✅ **Text-to-Speech**: gTTS with audio playback
- ✅ **Conversation Logging**: All interactions saved to text file
- ✅ **Graceful Exit**: Say "thank you" to stop

## 🔧 Custom Wake Word

To use custom "hey rudra" wake word:
1. Create custom .ppn file at [Picovoice Console](https://console.picovoice.ai/)
2. Save as `hey-rudra.ppn` in the project directory
3. The script will automatically detect and use it

## 📝 Logs

All conversations are saved to `conversation_log.txt` with timestamps.

## 🛠️ Troubleshooting

### Audio Issues
```bash
# Test audio devices
python -c "import sounddevice as sd; print(sd.query_devices())"
```

### API Issues
- Verify API keys in `.env` file
- Check internet connection
- Ensure API quotas are not exceeded

## 🎵 Tech Stack

- **pvporcupine**: Wake word detection
- **sounddevice**: Audio recording
- **openai-whisper**: Speech-to-text (free, local)
- **google-generativeai**: Gemini AI
- **gtts**: Text-to-speech
- **pygame**: Audio playback