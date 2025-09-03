import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'or' | 'pa';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: { code: Language; name: string; nativeName: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    'site.title': 'MediPlant AI',
    'site.tagline': 'Traditional Plant Knowledge',
    'nav.identify': 'Identify',
    'nav.knowledge': 'Knowledge Base',
    'nav.contribute': 'Contribute',
    'nav.community': 'Community',
    'hero.title': 'Discover Medicinal Plants with AI',
    'hero.description': 'Upload a photo of any plant to identify it and learn about its traditional medicinal uses from community knowledge.',
    'upload.title': 'Upload Plant Photo',
    'upload.description': 'Drop an image here or click to browse',
    'search.title': 'Search Plant Knowledge',
    'search.description': 'Explore our community-driven database of medicinal plants',
    'contribute.title': 'Share Your Knowledge',
    'contribute.description': 'Help preserve traditional medicinal plant wisdom by contributing to our community database',
    'community.title': 'Community Impact',
    'community.description': 'Together we are preserving traditional knowledge for future generations',
    'stats.plantsIdentified': 'Plants Identified',
    'stats.contributors': 'Contributors',
    'stats.knowledgeEntries': 'Knowledge Entries',
    'stats.languages': 'Languages',
    'form.plantName': 'Plant Name',
    'form.scientificName': 'Scientific Name',
    'form.uses': 'Medicinal Uses',
    'form.preparation': 'Preparation Methods',
    'form.location': 'Location',
    'form.contributorName': 'Your Name',
    'form.submit': 'Submit Contribution',
    'voice.title': 'Voice Contribution',
    'voice.description': 'Record your knowledge about medicinal plants in your own voice',
    'voice.startRecording': 'Start Recording',
    'voice.stopRecording': 'Stop Recording',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.username': 'Username',
    'auth.confirmPassword': 'Confirm Password',
    'auth.login': 'Login',
    'auth.register': 'Create Account',
    'auth.logout': 'Sign Out',
    'audio.listen': 'Listen',
    'audio.stop': 'Stop',
    'voice.selectVoice': 'Select Voice',
    'voice.chooseVoice': 'Choose a voice',
    'voice.noNativeVoices': 'No native voices available - showing all voices'
  },
  es: {
    'site.title': 'MediPlant AI',
    'site.tagline': 'Conocimiento Tradicional de Plantas',
    'nav.identify': 'Identificar',
    'nav.knowledge': 'Base de Conocimiento',
    'nav.contribute': 'Contribuir',
    'nav.community': 'Comunidad',
    'hero.title': 'Descubre Plantas Medicinales con IA',
    'hero.description': 'Sube una foto de cualquier planta para identificarla y aprender sobre sus usos medicinales tradicionales.',
    'upload.title': 'Subir Foto de Planta',
    'search.title': 'Buscar Conocimiento de Plantas',
    'contribute.title': 'Comparte tu Conocimiento',
    'community.title': 'Impacto Comunitario',
    'audio.listen': 'Escuchar',
    'audio.stop': 'Parar',
    'voice.selectVoice': 'Seleccionar Voz',
    'voice.chooseVoice': 'Elige una voz'
  },
  hi: {
    'site.title': 'मेडिप्लांट एआई',
    'site.tagline': 'पारंपरिक पौधे का ज्ञान',
    'nav.identify': 'पहचानें',
    'nav.knowledge': 'ज्ञान आधार',
    'nav.contribute': 'योगदान दें',
    'nav.community': 'समुदाय',
    'hero.title': 'एआई के साथ औषधीय पौधों की खोज करें',
    'upload.title': 'पौधे की तस्वीर अपलोड करें',
    'search.title': 'पौधे का ज्ञान खोजें',
    'contribute.title': 'अपना ज्ञान साझा करें',
    'community.title': 'सामुदायिक प्रभाव',
    'audio.listen': 'सुनें',
    'audio.stop': 'रोकें',
    'voice.selectVoice': 'आवाज़ चुनें',
    'voice.chooseVoice': 'एक आवाज़ चुनें',
    'voice.noNativeVoices': 'अंग्रेजी (भारत) आवाज़ का उपयोग - बेहतर अनुभव के लिए मूल भाषा की आवाज़ें स्थापित करें'
  },
  bn: {
    'site.title': 'মেডিপ্ল্যান্ট এআই',
    'site.tagline': 'ঐতিহ্যবাহী উদ্ভিদ জ্ঞান',
    'nav.identify': 'চিহ্নিত করুন',
    'nav.knowledge': 'জ্ঞান ভান্ডার',
    'nav.contribute': 'অবদান রাখুন',
    'nav.community': 'সম্প্রদায়',
    'hero.title': 'AI দিয়ে ঔষধি গাছ আবিষ্কার করুন',
    'upload.title': 'গাছের ছবি আপলোড করুন',
    'search.title': 'উদ্ভিদ জ্ঞান অনুসন্ধান করুন',
    'contribute.title': 'আপনার জ্ঞান শেয়ার করুন',
    'community.title': 'সামুদায়িক প্রভাব'
  },
  ta: {
    'site.title': 'மெடிபிளாண்ட் ஏஐ',
    'site.tagline': 'பாரம்பரிய தாவர அறிவு',
    'nav.identify': 'அடையாளம் காண்',
    'nav.knowledge': 'அறிவு தளம்',
    'nav.contribute': 'பங்களிப்பு',
    'nav.community': 'சமூகம்',
    'hero.title': 'AI உடன் மருத்துவ தாவரங்களை கண்டறியுங்கள்',
    'upload.title': 'தாவர புகைப்படம் பதிவேற்றவும்',
    'search.title': 'தாவர அறிவை தேடுங்கள்',
    'contribute.title': 'உங்கள் அறிவை பகிருங்கள்',
    'community.title': 'சமூக தாக்கம்',
    'audio.listen': 'கேளுங்கள்',
    'audio.stop': 'நிறுத்துங்கள்',
    'voice.selectVoice': 'குரல் தேர்வு',
    'voice.chooseVoice': 'ஒரு குரலை தேர்வு செய்யுங்கள்',
    'voice.noNativeVoices': 'ஆங்கிலம் (இந்தியா) குரல்களைப் பயன்படுத்துகிறது - சிறந்த அனுபவத்திற்கு சொந்த மொழி குரல்களை நிறுவவும்'
  },
  te: {
    'site.title': 'మెడిప్లాంట్ ఏఐ',
    'site.tagline': 'సాంప్రదాయ మొక్కల జ్ఞానం',
    'nav.identify': 'గుర్తించండి',
    'nav.knowledge': 'జ్ఞాన ధనం',
    'nav.contribute': 'సహాయం చేయండి',
    'nav.community': 'సమాజం',
    'hero.title': 'AI తో ఔషధ మొక్కలను కనుగొనండి',
    'upload.title': 'మొక్క చిత్రం అప్‌లోడ్ చేయండి',
    'search.title': 'మొక్కల జ్ఞానాన్ని శోధించండి',
    'contribute.title': 'మీ జ్ఞానాన్ని పంచుకోండి',
    'community.title': 'సామాజిక ప్రభావం',
    'audio.listen': 'వినండి',
    'audio.stop': 'ఆపండి',
    'voice.selectVoice': 'స్వరం ఎంచుకోండి',
    'voice.chooseVoice': 'ఒక స్వరం ఎంచుకోండి',
    'voice.noNativeVoices': 'ఇంగ్లీష్ (ఇండియా) వాయిస్‌లను ఉపయోగిస్తోంది - మెరుగైన అనుభవం కోసం స్థానిక భాష వాయిస్‌లను ఇన్‌స్టాల్ చేయండి'
  },
  mr: {
    'site.title': 'मेडिप्लांट एआय',
    'site.tagline': 'पारंपारिक वनस्पती ज्ञान',
    'nav.identify': 'ओळखा',
    'nav.knowledge': 'ज्ञान आधार',
    'nav.contribute': 'योगदान द्या',
    'nav.community': 'समुदाय',
    'hero.title': 'AI सह औषधी वनस्पती शोधा',
    'upload.title': 'वनस्पतीचा फोटो अपलोड करा',
    'search.title': 'वनस्पती ज्ञान शोधा',
    'contribute.title': 'तुमचे ज्ञान सामायिक करा',
    'community.title': 'सामुदायिक प्रभाव'
  },
  gu: {
    'site.title': 'મેડિપ્લાન્ટ એઆઈ',
    'site.tagline': 'પરંપરાગત છોડ જ્ઞાન',
    'nav.identify': 'ઓળખો',
    'nav.knowledge': 'જ્ઞાન આધાર',
    'nav.contribute': 'યોગદાન આપો',
    'nav.community': 'સમુદાય',
    'hero.title': 'AI સાથે ઔષધીય છોડ શોધો',
    'upload.title': 'છોડનો ફોટો અપલોડ કરો',
    'search.title': 'છોડ જ્ઞાન શોધો',
    'contribute.title': 'તમારું જ્ઞાન શેર કરો',
    'community.title': 'સામુદાયિક અસર'
  },
  kn: {
    'site.title': 'ಮೆಡಿಪ್ಲಾಂಟ್ ಎಐ',
    'site.tagline': 'ಸಾಂಪ್ರದಾಯಿಕ ಸಸ್ಯ ಜ್ಞಾನ',
    'nav.identify': 'ಗುರುತಿಸಿ',
    'nav.knowledge': 'ಜ್ಞಾನ ಭಂಡಾರ',
    'nav.contribute': 'ಕೊಡುಗೆ ನೀಡಿ',
    'nav.community': 'ಸಮುದಾಯ',
    'hero.title': 'AI ಯೊಂದಿಗೆ ಔಷಧೀಯ ಸಸ್ಯಗಳನ್ನು ಕಂಡುಕೊಳ್ಳಿ',
    'upload.title': 'ಸಸ್ಯದ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    'search.title': 'ಸಸ್ಯ ಜ್ಞಾನವನ್ನು ಹುಡುಕಿ',
    'contribute.title': 'ನಿಮ್ಮ ಜ್ಞಾನವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ',
    'community.title': 'ಸಾಮುದಾಯಿಕ ಪ್ರಭಾವ',
    'audio.listen': 'ಕೇಳಿ',
    'audio.stop': 'ನಿಲ್ಲಿಸಿ',
    'voice.selectVoice': 'ಧ್ವನಿ ಆಯ್ಕೆ',
    'voice.chooseVoice': 'ಒಂದು ಧ್ವನಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    'voice.noNativeVoices': 'ಇಂಗ್ಲಿಷ್ (ಇಂಡಿಯಾ) ಧ್ವನಿಗಳನ್ನು ಬಳಸುತ್ತಿದೆ - ಉತ್ತಮ ಅನುಭವಕ್ಕಾಗಿ ಸ್ಥಳೀಯ ಭಾಷೆಯ ಧ್ವನಿಗಳನ್ನು ಸ್ಥಾಪಿಸಿ'
  },
  ml: {
    'site.title': 'മെഡിപ്ലാന്റ് എഐ',
    'site.tagline': 'പരമ്പരാഗത ചെടി അറിവ്',
    'nav.identify': 'തിരിച്ചറിയുക',
    'nav.knowledge': 'അറിവ് ശേഖരം',
    'nav.contribute': 'സംഭാവന ചെയ്യുക',
    'nav.community': 'സമൂഹം',
    'hero.title': 'AI ഉപയോഗിച്ച് ഔഷധ സസ്യങ്ങൾ കണ്ടെത്തുക',
    'upload.title': 'ചെടിയുടെ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക',
    'search.title': 'സസ്യ അറിവ് തിരയുക',
    'contribute.title': 'നിങ്ങളുടെ അറിവ് പങ്കിടുക',
    'community.title': 'സാമുദായിക സ്വാധീനം'
  },
  or: {
    'site.title': 'ମେଡିପ୍ଲାଣ୍ଟ ଏଆଇ',
    'site.tagline': 'ପାରମ୍ପରିକ ଉଦ୍ଭିଦ ଜ୍ଞାନ',
    'nav.identify': 'ଚିହ୍ନଟ କରନ୍ତୁ',
    'nav.knowledge': 'ଜ୍ଞାନ ଭଣ୍ଡାର',
    'nav.contribute': 'ଅବଦାନ ରଖନ୍ତୁ',
    'nav.community': 'ସମ୍ପ୍ରଦାୟ',
    'hero.title': 'ଏଆଇ ସହିତ ଔଷଧୀୟ ଉଦ୍ଭିଦ ଆବିଷ୍କାର କରନ୍ତୁ',
    'upload.title': 'ଉଦ୍ଭିଦ ଫଟୋ ଅପଲୋଡ କରନ୍ତୁ',
    'search.title': 'ଉଦ୍ଭିଦ ଜ୍ଞାନ ଖୋଜନ୍ତୁ',
    'contribute.title': 'ଆପଣଙ୍କ ଜ୍ଞାନ ବାଣ୍ଟନ୍ତୁ',
    'community.title': 'ସାମୁଦାୟିକ ପ୍ରଭାବ'
  },
  pa: {
    'site.title': 'ਮੈਡੀਪਲਾਂਟ ਏਆਈ',
    'site.tagline': 'ਪਰੰਪਰਾਗਤ ਪੌਧੇ ਦਾ ਗਿਆਨ',
    'nav.identify': 'ਪਛਾਣੋ',
    'nav.knowledge': 'ਗਿਆਨ ਭੰਡਾਰ',
    'nav.contribute': 'ਯੋਗਦਾਨ ਪਾਓ',
    'nav.community': 'ਕਮਿਊਨਿਟੀ',
    'hero.title': 'ਏਆਈ ਨਾਲ ਦਵਾਈ ਦੇ ਪੌਧੇ ਲੱਭੋ',
    'upload.title': 'ਪੌਧੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ',
    'search.title': 'ਪੌਧੇ ਦਾ ਗਿਆਨ ਲੱਭੋ',
    'contribute.title': 'ਆਪਣਾ ਗਿਆਨ ਸਾਂਝਾ ਕਰੋ',
    'community.title': 'ਕਮਿਊਨਿਟੀ ਪ੍ਰਭਾਵ'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (Object.keys(translations).includes(browserLang)) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const languages = [
    { code: 'en' as Language, name: 'English', nativeName: 'English' },
    { code: 'es' as Language, name: 'Spanish', nativeName: 'Español' },
    { code: 'hi' as Language, name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bn' as Language, name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'ta' as Language, name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te' as Language, name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'mr' as Language, name: 'Marathi', nativeName: 'मराठी' },
    { code: 'gu' as Language, name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'kn' as Language, name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml' as Language, name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'or' as Language, name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
    { code: 'pa' as Language, name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  ];

  const value = {
    language,
    setLanguage,
    t,
    languages,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}