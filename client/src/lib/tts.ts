export const speakText = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Text-to-speech not supported in this browser'));
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to use a more natural voice if available
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') && voice.name.includes('Google')
    ) || voices.find(voice => 
      voice.lang.includes('en')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(`Speech synthesis failed: ${event.error}`));

    speechSynthesis.speak(utterance);
  });
};

export const stopSpeech = (): void => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
};

export const isSpeechSupported = (): boolean => {
  return 'speechSynthesis' in window;
};
