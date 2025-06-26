from gtts import gTTS
import sys
import os

def text_to_speech(text, lang='en', output_file='speech.mp3'):
    try:
        tts = gTTS(text=text, lang=lang)
        tts.save(output_file)
        print(f"Speech saved to {output_file}")
    except Exception as e:
        print(f"Error generating speech: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python speech.py '<text to speak>' [language_code] [output_file]")
        sys.exit(1)

    input_text = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else 'en'
    output = sys.argv[3] if len(sys.argv) > 3 else 'speech.mp3'

    text_to_speech(input_text, language, output)

