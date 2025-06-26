class VoiceAIAssistant {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.audioBlob = null;
    this.transcription = '';
    this.translation = '';
    this.currentLanguage = 'en';

    this.initializeElements();
    this.attachEventListeners();
    this.initializeWaveform();
  }

  initializeElements() {
    this.recordBtn = document.getElementById('recordBtn');
    this.recordStatus = document.getElementById('recordStatus');
    this.uploadArea = document.getElementById('uploadArea');
    this.audioFileInput = document.getElementById('audioFile');
    this.transcribeBtn = document.getElementById('transcribeBtn');
    this.waveform = document.getElementById('waveform');
    this.audioPreview = document.getElementById('audioPreview');
    this.audioPlayer = document.getElementById('audioPlayer');

    this.step1 = document.getElementById('step1');
    this.step2 = document.getElementById('step2');
    this.step1Indicator = document.getElementById('step1-indicator');
    this.step2Indicator = document.getElementById('step2-indicator');
    this.transcriptionText = document.getElementById('transcriptionText');
    this.translationText = document.getElementById('translationText');
    this.translationContainer = document.getElementById('translationContainer');
    this.languageSelect = document.getElementById('languageSelect');

    this.ttsOriginalBtn = document.getElementById('ttsOriginalBtn');
    this.translateBtn = document.getElementById('translateBtn');
    this.ttsTranslatedBtn = document.getElementById('ttsTranslatedBtn');
    this.startOverBtn = document.getElementById('startOverBtn');
    this.downloadLinks = document.getElementById('downloadLinks');

    this.loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    this.loadingText = document.getElementById('loadingText');
    this.loadingSubtext = document.getElementById('loadingSubtext');
  }

  attachEventListeners() {
    this.recordBtn.addEventListener('click', () => this.toggleRecording());
    this.uploadArea.addEventListener('click', () => this.audioFileInput.click());
    this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
    this.audioFileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    this.transcribeBtn.addEventListener('click', () => this.transcribeAudio());

    this.ttsOriginalBtn.addEventListener('click', () => this.convertToSpeech(this.transcription, 'en'));
    this.translateBtn.addEventListener('click', () => this.translateText());
    this.ttsTranslatedBtn.addEventListener('click', () => this.convertToSpeech(this.translation, this.currentLanguage));

    this.startOverBtn.addEventListener('click', () => this.startOver());
  }

  initializeWaveform() {
    for (let i = 0; i < 40; i++) {
      const bar = document.createElement('div');
      bar.className = 'waveform-bar';
      bar.style.height = '2px';
      this.waveform.appendChild(bar);
    }
  }

  async toggleRecording() {
    if (!this.isRecording) {
      await this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.displayAudioPreview();
        this.enableTranscribeButton();
        stream.getTracks().forEach((track) => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.updateRecordingUI();
      this.startWaveformAnimation();
    } catch (error) {
      console.error('Error starting recording:', error);
      this.showError('Microphone access denied or not available');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.updateRecordingUI();
      this.stopWaveformAnimation();
    }
  }

  updateRecordingUI() {
    if (this.isRecording) {
      this.recordBtn.innerHTML = '<i class="bi bi-stop-fill"></i>';
      this.recordBtn.classList.add('recording');
      this.recordStatus.textContent = 'Recording... Click to stop';
      this.waveform.style.display = 'flex';
    } else {
      this.recordBtn.innerHTML = '<i class="bi bi-mic-fill"></i>';
      this.recordBtn.classList.remove('recording');
      this.recordStatus.textContent = 'Recording completed';
      this.waveform.style.display = 'none';
    }
  }

  startWaveformAnimation() {
    const bars = this.waveform.querySelectorAll('.waveform-bar');
    this.waveformInterval = setInterval(() => {
      bars.forEach((bar) => {
        const height = Math.random() * 50 + 2;
        bar.style.height = `${height}px`;
      });
    }, 100);
  }

  stopWaveformAnimation() {
    if (this.waveformInterval) {
      clearInterval(this.waveformInterval);
      const bars = this.waveform.querySelectorAll('.waveform-bar');
      bars.forEach((bar) => {
        bar.style.height = '2px';
      });
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    this.uploadArea.classList.add('dragover');
  }
  handleDragLeave(e) {
    e.preventDefault();
    this.uploadArea.classList.remove('dragover');
  }
  handleFileDrop(e) {
    e.preventDefault();
    this.uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.handleAudioBlob(files[0]);
    }
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.handleAudioBlob(file);
    }
  }

  handleAudioBlob(fileOrBlob) {
    this.audioBlob = fileOrBlob;
    this.displayAudioPreview();
    this.enableTranscribeButton();
  }

  displayAudioPreview() {
    const audioURL = URL.createObjectURL(this.audioBlob);
    this.audioPlayer.src = audioURL;
    this.audioPreview.style.display = 'block';
  }

  enableTranscribeButton() {
    this.transcribeBtn.disabled = false;
  }

  showLoading(message, subtext = '') {
    this.loadingText.textContent = message;
    this.loadingSubtext.textContent = subtext;
    this.loadingModal.show();
  }

  hideLoading() {
    this.loadingModal.hide();
  }

  showError(message) {
    alert(`❌ Error: ${message}`);
  }

  async transcribeAudio() {
    if (!this.audioBlob) return;
    this.showLoading('Transcribing...', 'Using Whisper AI');

    const formData = new FormData();
    formData.append('audio', this.audioBlob);

    try {
      const response = await fetch('/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Transcription failed');
      }

      this.transcription = data.transcription || data.text || '';
      this.transcriptionText.value = this.transcription;

      this.step2.style.display = 'block';
      this.step1Indicator.classList.remove('active');
      this.step2Indicator.classList.add('active');

      // Reset translation related UI
      this.translation = '';
      this.translationText.value = '';
      this.translationContainer.style.display = 'none';
      this.ttsTranslatedBtn.disabled = true;
      this.downloadLinks.innerHTML = '';
    } catch (err) {
      console.error('Transcription failed:', err);
      this.showError(err.message || 'Transcription failed');
    } finally {
      this.hideLoading();
    }
  }

  async translateText() {
    const targetLang = this.languageSelect.value;
    if (!this.transcription || !targetLang) return;

    this.showLoading('Translating...', `To ${targetLang.toUpperCase()}`);

    try {
      const response = await fetch('/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: this.transcription, target_lang: targetLang }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Translation failed');
      }

      this.translation = data.translated_text || data.text || '';
      this.translationText.value = this.translation;
      this.translationContainer.style.display = 'block';
      this.currentLanguage = targetLang;

      this.ttsTranslatedBtn.disabled = false;
      this.downloadLinks.innerHTML = '';
    } catch (err) {
      console.error('Translation failed:', err);
      this.showError(err.message || 'Translation failed');
    } finally {
      this.hideLoading();
    }
  }

  async convertToSpeech(text, lang) {
    if (!text) return;

    this.showLoading('Generating speech...', lang);

    try {
      const response = await fetch('/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Text-to-Speech failed');
      }

      const audioUrl = data.audio_url;

      // Remove previous download links
      this.downloadLinks.innerHTML = '';

      // Create audio player & download link
      const audioElement = document.createElement('audio');
      audioElement.controls = true;
      audioElement.src = audioUrl;

      const downloadLink = document.createElement('a');
      downloadLink.href = audioUrl;
      downloadLink.download = data.filename || `speech_${lang}.mp3`;
      downloadLink.textContent = `🔊 Play & Download Speech (${lang.toUpperCase()})`;
      downloadLink.className = 'btn btn-success my-2 d-block';

      this.downloadLinks.appendChild(audioElement);
      this.downloadLinks.appendChild(downloadLink);
    } catch (err) {
      console.error('TTS failed:', err);
      this.showError(err.message || 'Text-to-Speech failed');
    } finally {
      this.hideLoading();
    }
  }

  startOver() {
    window.location.reload();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.voiceAI = new VoiceAIAssistant();
});
