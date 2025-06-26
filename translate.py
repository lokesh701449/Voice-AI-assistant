from googletrans import Translator

def translate_text(text, target_lang):
    translator = Translator()
    try:
        translated = translator.translate(text, dest=target_lang)
        return translated.text
    except Exception as e:
        # Optionally log error or raise
        raise RuntimeError(f"Translation failed: {e}")


