// Enhanced Hindi TTS with reliable browser support
export const speakText = async (text: string, language: string = 'en', selectedVoice?: SpeechSynthesisVoice | null): Promise<void> => {
  // For Hindi and other Indian languages, use enhanced browser TTS first
  if (['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'or', 'pa'].includes(language)) {
    console.log(`🗣️ Speaking ${language}: "${text.substring(0, 50)}..."`);
    
    // Method 1: Enhanced Web Speech API (most reliable for Hindi)
    try {
      const success = await tryEnhancedWebSpeechAPI(text, language, selectedVoice);
      if (success) {
        console.log('✅ Enhanced Web Speech API successful for', language);
        return;
      }
    } catch (error) {
      console.log('⚠️ Enhanced Web Speech API failed:', error);
    }

    // Method 2: Transliteration for Hindi (very reliable)
    if (language === 'hi') {
      try {
        const transliteratedText = convertHindiToTransliteration(text);
        if (transliteratedText !== text) {
          console.log(`🔄 Using transliteration: ${transliteratedText}`);
          await speakText(transliteratedText, 'en', selectedVoice);
          return;
        }
      } catch (error) {
        console.log('⚠️ Transliteration failed:', error);
      }
    }

    // Method 3: Try API-based TTS as fallback
    try {
      const success = await tryAPIBasedTTS(text, language);
      if (success) {
        console.log('✅ API TTS successful');
        return;
      }
    } catch (error) {
      console.log('⚠️ API TTS failed:', error);
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

// Enhanced Web Speech API for Hindi with better voice detection
const tryEnhancedWebSpeechAPI = async (text: string, language: string, selectedVoice?: SpeechSynthesisVoice | null): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve(false);
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Enhanced language mapping for Hindi
    const languageMap: { [key: string]: string[] } = {
      'hi': ['hi-IN', 'hi', 'en-IN'],
      'bn': ['bn-IN', 'bn-BD', 'bn', 'en-IN'],
      'ta': ['ta-IN', 'ta', 'en-IN'],
      'te': ['te-IN', 'te', 'en-IN'],
      'mr': ['mr-IN', 'mr', 'en-IN'],
      'gu': ['gu-IN', 'gu', 'en-IN'],
      'kn': ['kn-IN', 'kn', 'en-IN'],
      'ml': ['ml-IN', 'ml', 'en-IN'],
      'or': ['or-IN', 'or', 'en-IN'],
      'pa': ['pa-IN', 'pa', 'en-IN']
    };

    // Get available voices
    let voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Wait for voices to load
      speechSynthesis.addEventListener('voiceschanged', () => {
        voices = speechSynthesis.getVoices();
      });
      setTimeout(() => voices = speechSynthesis.getVoices(), 100);
    }

    console.log('🎯 Available voices:', voices.map(v => `${v.name} (${v.lang})`));

    // Find best voice for the language
    let bestVoice: SpeechSynthesisVoice | null = null;
    const targetLanguages = languageMap[language] || [language];

    for (const langCode of targetLanguages) {
      // Try to find Google or Microsoft voices (better quality)
      bestVoice = voices.find(voice => 
        voice.lang.toLowerCase().startsWith(langCode.toLowerCase()) && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      ) || null;
      
      if (bestVoice) {
        console.log(`🎯 Found premium voice: ${bestVoice.name} (${bestVoice.lang})`);
        break;
      }
      
      // Try any voice for that language
      bestVoice = voices.find(voice => 
        voice.lang.toLowerCase().startsWith(langCode.toLowerCase())
      ) || null;
      
      if (bestVoice) {
        console.log(`🎯 Found voice: ${bestVoice.name} (${bestVoice.lang})`);
        break;
      }
    }

    // Use selected voice or best found voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      console.log(`🎯 Using selected voice: ${selectedVoice.name}`);
    } else if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
      console.log(`🎯 Using best voice: ${bestVoice.name}`);
    } else {
      // Force language even without specific voice
      utterance.lang = language === 'hi' ? 'hi-IN' : `${language}-IN`;
      console.log(`🎯 Using default with forced language: ${utterance.lang}`);
    }

    // Optimal settings for Indian languages
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      console.log(`🗣️ Started speaking in ${utterance.lang}`);
    };

    utterance.onend = () => {
      console.log('✅ Speech completed successfully');
      resolve(true);
    };
    
    utterance.onerror = (event) => {
      console.error('❌ Speech error:', event.error);
      resolve(false);
    };

    // Start speaking
    speechSynthesis.speak(utterance);
  });
};

// API-based TTS fallback
const tryAPIBasedTTS = async (text: string, language: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, language, provider: 'auto' }),
    });

    if (!response.ok) {
      throw new Error(`API TTS failed: ${response.status}`);
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
    console.error('ElevenLabs TTS error:', error);
    return false;
  }
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

// Enhanced Hindi to Roman transliteration for better TTS
const convertHindiToTransliteration = (text: string): string => {
  const hindiToRoman: { [key: string]: string } = {
    // Medicinal plants
    'हल्दी': 'Haldi turmeric',
    'नीम': 'Neem margosa', 
    'अदरक': 'Adrak ginger',
    'घृतकुमारी': 'Ghrit kumari aloe vera',
    'अश्वगंधा': 'Ashwagandha winter cherry',
    'ब्राह्मी': 'Brahmi bacopa',
    'तुलसी': 'Tulsi holy basil',
    'आंवला': 'Amla indian gooseberry',
    'मेथी': 'Methi fenugreek',
    'दालचीनी': 'Dalchini cinnamon',
    'लहसुन': 'Lahsun garlic',
    'प्याज': 'Pyaaz onion',
    'धनिया': 'Dhaniya coriander',
    'जीरा': 'Jeera cumin',
    'काली मिर्च': 'Kali mirch black pepper',
    'लौंग': 'Laung clove',
    'इलायची': 'Elaichi cardamom',
    'अजवाइन': 'Ajwain carom seeds',
    
    // Medical conditions 
    'सूजन': 'soojun inflammation',
    'गठिया': 'gathiya arthritis',
    'घाव': 'ghaav wounds',
    'प्रतिरक्षा': 'pratiraksha immunity',
    'पाचन': 'paachan digestion',
    'तनाव': 'tanaav stress',
    'चिंता': 'chinta anxiety',
    'थकान': 'thakaan fatigue',
    'अनिद्रा': 'anidra insomnia',
    'बुखार': 'bukhaar fever',
    'संक्रमण': 'sankraman infection',
    'त्वचा': 'twacha skin',
    'रोग': 'rog disease',
    'मधुमेह': 'madhumeh diabetes',
    'जलन': 'jalan burning sensation',
    'मतली': 'matali nausea',
    'अपच': 'apaach indigestion',
    'सर्दी': 'sardi cold',
    'खांसी': 'khaansi cough',
    'सिरदर्द': 'sirdard headache',
    'पेट दर्द': 'pet dard stomach pain',
    
    // Body parts
    'सिर': 'sir head',
    'पेट': 'pet stomach',
    'हृदय': 'hriday heart',
    'यकृत': 'yakrit liver',
    'गुर्दे': 'gurde kidneys',
    'फेफड़े': 'phephde lungs',
    
    // Common words
    'के लिए': 'ke liye for',
    'में': 'mein in',
    'से': 'se from',
    'और': 'aur and',
    'है': 'hai is',
    'का': 'ka of',
    'यह': 'yah this',
    'एक': 'ek one',
    'अच्छा': 'accha good',
    'बुरा': 'bura bad'
  };

  let transliterated = text;
  
  // Replace Hindi text with phonetic equivalents
  for (const [hindi, roman] of Object.entries(hindiToRoman)) {
    transliterated = transliterated.replace(new RegExp(hindi, 'g'), roman);
  }
  
  // If still contains Devanagari, try basic character mapping
  if (/[\u0900-\u097F]/.test(transliterated)) {
    console.log('📝 Using basic Devanagari transliteration');
    transliterated = transliterated
      .replace(/क/g, 'ka').replace(/ख/g, 'kha').replace(/ग/g, 'ga').replace(/घ/g, 'gha')
      .replace(/च/g, 'cha').replace(/छ/g, 'chha').replace(/ज/g, 'ja').replace(/झ/g, 'jha')
      .replace(/ट/g, 'ta').replace(/ठ/g, 'tha').replace(/ड/g, 'da').replace(/ढ/g, 'dha')
      .replace(/त/g, 'ta').replace(/थ/g, 'tha').replace(/द/g, 'da').replace(/ध/g, 'dha')
      .replace(/न/g, 'na').replace(/प/g, 'pa').replace(/फ/g, 'pha').replace(/ब/g, 'ba')
      .replace(/भ/g, 'bha').replace(/म/g, 'ma').replace(/य/g, 'ya').replace(/र/g, 'ra')
      .replace(/ल/g, 'la').replace(/व/g, 'va').replace(/श/g, 'sha').replace(/ष/g, 'sha')
      .replace(/स/g, 'sa').replace(/ह/g, 'ha')
      .replace(/अ/g, 'a').replace(/आ/g, 'aa').replace(/इ/g, 'i').replace(/ई/g, 'ee')
      .replace(/उ/g, 'u').replace(/ऊ/g, 'oo').replace(/ए/g, 'e').replace(/ओ/g, 'o');
  }
  
  return transliterated;
};
