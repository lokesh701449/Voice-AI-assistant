import whisper
import tempfile
import os

def transcribe_audio(file_path):
    """
    Transcribes the audio file at file_path using Whisper model.
    Returns the transcribed text.
    """
    model = whisper.load_model("base")  # Change to 'small', 'medium', 'large' if you want
    result = model.transcribe(file_path)
    return result["text"]

def transcribe_audio_bytes(audio_bytes):
    """
    Accepts audio file bytes, saves to temp file, transcribes, then deletes temp.
    Returns transcribed text.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        transcript = transcribe_audio(tmp_path)
    finally:
        os.remove(tmp_path)

    return transcript

# Example usage:
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <audio_file_path>")
        sys.exit(1)

    audio_path = sys.argv[1]
    text = transcribe_audio(audio_path)
    print("Transcription:")
    print(text)


