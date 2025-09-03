// Enhanced TTS with multiple fallback methods for better Hindi support
export const speakText = async (text: string, language: string = 'en', selectedVoice?: SpeechSynthesisVoice | null): Promise<void> => {
  // For Hindi and other Indian languages, try multiple methods
  if (['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'or', 'pa'].includes(language)) {
    console.log(`Attempting TTS for ${language}: "${text.substring(0, 50)}..."`);
    
    // Method 1: Try OpenAI TTS first
    try {
      const success = await tryOpenAITTS(text, language);
      if (success) {
        console.log('OpenAI TTS successful');
        return;
      }
    } catch (error) {
      console.log('OpenAI TTS failed, trying alternative methods:', error);
    }

    // Method 2: Try Web Speech API with forced language
    try {
      const success = await tryWebSpeechAPI(text, language);
      if (success) {
        console.log('Web Speech API successful');
        return;
      }
    } catch (error) {
      console.log('Web Speech API failed:', error);
    }

    // Method 3: Fallback to transliteration if it's Hindi
    if (language === 'hi') {
      try {
        const transliteratedText = convertHindiToTransliteration(text);
        if (transliteratedText !== text) {
          console.log(`Using transliteration: ${transliteratedText}`);
          await speakText(transliteratedText, 'en', selectedVoice);
          return;
        }
      } catch (error) {
        console.log('Transliteration failed:', error);
      }
    }
  }

  // Fallback to browser TTS
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

    // Language-specific voice mapping with enhanced Hindi support
    const languageVoiceMap: Record<string, string[]> = {
      'en': ['en-US', 'en-GB', 'en-AU', 'en-IN', 'en'],
      'hi': ['hi-IN', 'hi', 'en-IN'], // Add en-IN as fallback for Hindi
      'te': ['te-IN', 'te', 'en-IN'],
      'ta': ['ta-IN', 'ta', 'en-IN'],
      'kn': ['kn-IN', 'kn', 'en-IN'],
      'es': ['es-ES', 'es-MX', 'es'],
      'bn': ['bn-IN', 'bn-BD', 'bn', 'en-IN'],
      'mr': ['mr-IN', 'mr', 'en-IN'],
      'gu': ['gu-IN', 'gu', 'en-IN'],
      'ml': ['ml-IN', 'ml', 'en-IN'],
      'or': ['or-IN', 'or', 'en-IN'],
      'pa': ['pa-IN', 'pa', 'en-IN']
    };

    // Get available voices - ensure they're loaded
    let voices = speechSynthesis.getVoices();
    
    // If no voices yet (Chrome sometimes loads them async), wait and try again
    if (voices.length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        voices = speechSynthesis.getVoices();
        console.log('Voices loaded:', voices.length);
      });
      
      // Small delay to allow voices to load
      setTimeout(() => {
        voices = speechSynthesis.getVoices();
      }, 100);
    }

    console.log(`TTS Debug - Language: ${language}, Available voices:`, voices.map(v => ({ name: v.name, lang: v.lang })));
    
    let voiceToUse: SpeechSynthesisVoice | null = selectedVoice || null;

    // If no voice is explicitly selected, find the best voice for the language
    if (!voiceToUse) {
      const targetLanguages = languageVoiceMap[language] || ['en-US', 'en'];
      console.log(`TTS Debug - Target languages for ${language}:`, targetLanguages);

      // Try to find voices in order of preference
      for (const langCode of targetLanguages) {
        // First try to find Microsoft/Google voices (usually better quality)
        voiceToUse = voices.find(voice => 
          voice.lang.toLowerCase().startsWith(langCode.toLowerCase()) && 
          (voice.name.includes('Google') || voice.name.includes('Microsoft'))
        ) || null;
        
        if (voiceToUse) {
          console.log(`TTS Debug - Found premium voice: ${voiceToUse.name} (${voiceToUse.lang})`);
          break;
        }
        
        // Then try any voice for that language
        voiceToUse = voices.find(voice => 
          voice.lang.toLowerCase().startsWith(langCode.toLowerCase())
        ) || null;
        
        if (voiceToUse) {
          console.log(`TTS Debug - Found matching voice: ${voiceToUse.name} (${voiceToUse.lang})`);
          break;
        }
      }

      // Special handling for Hindi - look for specific voice names if no direct match
      if (!voiceToUse && language === 'hi') {
        // Look for common Hindi voice names
        voiceToUse = voices.find(voice => {
          const name = voice.name.toLowerCase();
          const lang = voice.lang.toLowerCase();
          return (
            name.includes('hindi') || 
            name.includes('ravi') ||
            name.includes('hemant') ||
            name.includes('priya') ||
            name.includes('kiran') ||
            lang.includes('hi') ||
            lang === 'hi-in' ||
            // Microsoft voices
            (name.includes('microsoft') && (name.includes('indian') || lang.includes('hi'))) ||
            // Google voices
            (name.includes('google') && (name.includes('indian') || lang.includes('hi')))
          );
        }) || null;
        
        if (voiceToUse) {
          console.log(`TTS Debug - Found Hindi voice by name/lang: ${voiceToUse.name} (${voiceToUse.lang})`);
        }
      }

      // Fallback to Indian English voice for Indian languages
      if (!voiceToUse && ['hi', 'te', 'ta', 'kn', 'bn', 'mr', 'gu', 'ml', 'or', 'pa'].includes(language)) {
        voiceToUse = voices.find(voice => 
          voice.lang.toLowerCase().includes('en-in') || 
          (voice.name.toLowerCase().includes('ravi') || voice.name.toLowerCase().includes('heera'))
        ) || null;
        
        if (voiceToUse) {
          console.log(`TTS Debug - Using Indian English fallback: ${voiceToUse.name} (${voiceToUse.lang})`);
        }
      }

      // Final fallback to default English voice
      if (!voiceToUse) {
        voiceToUse = voices.find(voice => 
          voice.lang.includes('en') && (voice.name.includes('Google') || voice.name.includes('Microsoft'))
        ) || voices.find(voice => 
          voice.lang.includes('en')
        ) || voices[0] || null;
        
        if (voiceToUse) {
          console.log(`TTS Debug - Using English fallback: ${voiceToUse.name} (${voiceToUse.lang})`);
        }
      }
    } else {
      console.log(`TTS Debug - Using selected voice: ${selectedVoice?.name} (${selectedVoice?.lang})`);
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang;
      console.log(`TTS Debug - Final voice selection: ${voiceToUse.name} (${voiceToUse.lang})`);
    } else {
      console.log('TTS Debug - No suitable voice found, using browser default');
      // Force the language setting regardless of voice availability
      utterance.lang = language === 'hi' ? 'hi-IN' : language;
    }

    // Force the language setting for Hindi regardless of voice selection
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
      console.log('TTS Debug - Forcing Hindi language (hi-IN) for utterance');
    }

    utterance.onstart = () => {
      console.log(`TTS Debug - Started speaking: "${text.substring(0, 50)}..." in ${utterance.lang} using voice: ${utterance.voice?.name || 'default'}`);
    };

    utterance.onend = () => {
      console.log('TTS Debug - Speech ended');
      resolve();
    };
    
    utterance.onerror = (event) => {
      console.error('TTS Debug - Speech error:', event.error);
      reject(new Error(`Speech synthesis failed: ${event.error}`));
    };

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

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  return speechSynthesis.getVoices();
};

export const getVoicesForLanguage = (language: string): SpeechSynthesisVoice[] => {
  const voices = getAvailableVoices();
  
  const languageVoiceMap: Record<string, string[]> = {
    'en': ['en-US', 'en-GB', 'en-AU', 'en-IN', 'en'],
    'hi': ['hi-IN', 'hi', 'en-IN'], // Include English (India) as fallback for Hindi
    'te': ['te-IN', 'te', 'en-IN'],
    'ta': ['ta-IN', 'ta', 'en-IN'], 
    'kn': ['kn-IN', 'kn', 'en-IN'],
    'es': ['es-ES', 'es-MX', 'es'],
    'bn': ['bn-IN', 'bn-BD', 'bn', 'en-IN'],
    'mr': ['mr-IN', 'mr', 'en-IN'],
    'gu': ['gu-IN', 'gu', 'en-IN'],
    'ml': ['ml-IN', 'ml', 'en-IN'],
    'or': ['or-IN', 'or', 'en-IN'],
    'pa': ['pa-IN', 'pa', 'en-IN']
  };

  const targetLanguages = languageVoiceMap[language] || ['en'];
  
  // Try exact language matches first
  let filteredVoices = voices.filter(voice => 
    targetLanguages.some(lang => voice.lang.toLowerCase().startsWith(lang.toLowerCase()))
  );
  
  // If no exact matches, try broader matching for Indian languages
  if (filteredVoices.length === 0 && ['hi', 'te', 'ta', 'kn', 'bn', 'mr', 'gu', 'ml', 'or', 'pa'].includes(language)) {
    // Look for any voice that might contain the language name or Indian English voices
    filteredVoices = voices.filter(voice => {
      const voiceName = voice.name.toLowerCase();
      const voiceLang = voice.lang.toLowerCase();
      
      return (
        voiceName.includes(language) || 
        voiceLang.includes(language) ||
        (language === 'hi' && (voiceName.includes('hindi') || voiceLang.includes('hindi') || voiceName.includes('ravi') || voiceName.includes('hemant'))) ||
        (language === 'te' && (voiceName.includes('telugu') || voiceLang.includes('telugu'))) ||
        (language === 'ta' && (voiceName.includes('tamil') || voiceLang.includes('tamil'))) ||
        (language === 'kn' && (voiceName.includes('kannada') || voiceLang.includes('kannada'))) ||
        // Include Indian English voices as better fallback
        (voiceLang.includes('en-in') || (voiceName.includes('ravi') || voiceName.includes('heera')))
      );
    });
  }
  
  // If still no matches, include high-quality Indian English voices as fallback
  if (filteredVoices.length === 0 && ['hi', 'te', 'ta', 'kn', 'bn', 'mr', 'gu', 'ml', 'or', 'pa'].includes(language)) {
    filteredVoices = voices.filter(voice => 
      voice.lang.toLowerCase().includes('en-in') || 
      voice.name.toLowerCase().includes('ravi') ||
      voice.name.toLowerCase().includes('heera') ||
      (voice.lang.toLowerCase().includes('en') && voice.name.toLowerCase().includes('india'))
    );
  }
  
  console.log(`Filtering voices for language ${language}:`, {
    totalVoices: voices.length,
    targetLanguages,
    filteredCount: filteredVoices.length,
    filtered: filteredVoices.map(v => ({ name: v.name, lang: v.lang }))
  });
  
  return filteredVoices;
};

// OpenAI TTS function for better Hindi support
const tryOpenAITTS = async (text: string, language: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
      throw new Error(`TTS API failed: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(true);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };
      
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    return false;
  }
};

// Helper function for Web Speech API with better language support
const tryWebSpeechAPI = async (text: string, language: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : language;
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);

    speechSynthesis.speak(utterance);
  });
};

// Convert Hindi Devanagari to transliteration for better TTS
const convertHindiToTransliteration = (text: string): string => {
  const hindiToRoman: { [key: string]: string } = {
    'हल्दी': 'Haldi',
    'नीम': 'Neem', 
    'अदरक': 'Adrak',
    'घृतकुमारी': 'Ghrit Kumari',
    'अश्वगंधा': 'Ashwagandha',
    'ब्राह्मी': 'Brahmi',
    'तुलसी': 'Tulsi',
    'आंवला': 'Amla',
    'मेथी': 'Methi',
    'दालचीनी': 'Dalchini',
    'सूजन': 'inflammation',
    'गठिया': 'arthritis',
    'घाव': 'wounds',
    'प्रतिरक्षा': 'immunity',
    'पाचन': 'digestion',
    'तनाव': 'stress',
    'चिंता': 'anxiety',
    'थकान': 'fatigue',
    'अनिद्रा': 'insomnia',
    'बुखार': 'fever',
    'संक्रमण': 'infection',
    'त्वचा': 'skin',
    'रोग': 'disease',
    'मधुमेह': 'diabetes',
    'जलन': 'burns',
    'मतली': 'nausea',
    'अपच': 'indigestion',
    'सर्दी': 'cold',
    'खांसी': 'cough'
  };

  let transliterated = text;
  for (const [hindi, roman] of Object.entries(hindiToRoman)) {
    transliterated = transliterated.replace(new RegExp(hindi, 'g'), roman);
  }
  return transliterated;
};
