from flask import Flask, request, jsonify, render_template, send_file
from werkzeug.utils import secure_filename
import os
import uuid
import json
from datetime import datetime
import io
import tempfile
from t import transcribe_audio 
from translate import translate_text
from gtts import gTTS  # ✅ Use the function from translate.py

# Import your existing AI modules here
# from your_whisper_module import transcribe_audio
# from your_translation_module import translate_text
# from your_tts_module import text_to_speech

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20MB max file size
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['AUDIO_FOLDER'] = 'static/audio'

# Create directories if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['AUDIO_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'm4a', 'ogg', 'webm'}
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'hi': 'Hindi',
    'te': 'Telugu', 
    'ta': 'Tamil',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'ja': 'Japanese'
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/transcribe', methods=['POST']) # ✅ Importing your Whisper-based function

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            try:
                transcription = transcribe_audio(filepath)
                # Optionally delete file after transcription
                # os.remove(filepath)

                return jsonify({
                    'success': True,
                    'transcription': transcription,
                    'timestamp': datetime.now().isoformat()
                })

            except Exception as e:
                if os.path.exists(filepath):
                    os.remove(filepath)
                return jsonify({'error': f'Transcription failed: {str(e)}'}), 500

        return jsonify({'error': 'Invalid file type'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/translate', methods=['POST'])
def translate():
    try:
        data = request.get_json()
        text = data.get('text', '')
        target_lang = data.get('target_lang', 'en')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        if target_lang not in SUPPORTED_LANGUAGES:
            return jsonify({'error': 'Unsupported language'}), 400

        try:
            # ✅ Use actual translation function
            translated_text = translate_text(text, target_lang)

            return jsonify({
                'success': True,
                'translated_text': translated_text,
                'source_lang': 'auto',
                'target_lang': target_lang,
                'timestamp': datetime.now().isoformat()
            })

        except Exception as e:
            return jsonify({'error': f'Translation failed: {str(e)}'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        lang = data.get('lang', 'en').strip()
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        if lang not in SUPPORTED_LANGUAGES:
            return jsonify({'error': f'Unsupported language: {lang}'}), 400
        
        try:
            # Generate unique filename for the audio
            audio_filename = f"tts_{uuid.uuid4()}.mp3"
            audio_path = os.path.join(app.config['AUDIO_FOLDER'], audio_filename)
            
            # Use gTTS to generate speech
            tts = gTTS(text=text, lang=lang)
            tts.save(audio_path)
            
            return jsonify({
                'success': True,
                'audio_url': f'/download/{audio_filename}',
                'filename': audio_filename,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            return jsonify({'error': f'TTS generation failed: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/download/<filename>')
def download_file(filename):
    try:
        # Security check
        filename = secure_filename(filename)
        file_path = os.path.join(app.config['AUDIO_FOLDER'], filename)
        
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/languages')
def get_languages():
    return jsonify(SUPPORTED_LANGUAGES)

# Error handlers
@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 20MB.'}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)