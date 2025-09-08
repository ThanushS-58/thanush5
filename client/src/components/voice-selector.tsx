import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getVoicesForLanguage, getAvailableVoices } from "@/lib/tts";
import { useLanguage } from "@/contexts/language-context";

interface VoiceSelectorProps {
  onVoiceChange: (voice: SpeechSynthesisVoice | null) => void;
  selectedVoice?: SpeechSynthesisVoice | null;
}

export default function VoiceSelector({ onVoiceChange, selectedVoice }: VoiceSelectorProps) {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { language, t } = useLanguage();

  useEffect(() => {
    const loadVoices = () => {
      // Get all available voices first
      const allVoices = getAvailableVoices();
      console.log('All available voices:', allVoices.map(v => ({ name: v.name, lang: v.lang })));
      
      // Try to get voices for the current language
      let voices = getVoicesForLanguage(language);
      console.log(`Voices for ${language}:`, voices.map(v => ({ name: v.name, lang: v.lang })));
      
      // If no voices found for the language, show all voices as fallback
      if (voices.length === 0) {
        console.log(`No voices found for ${language}, showing all available voices`);
        voices = allVoices;
      }
      
      setAvailableVoices(voices);
      
      // Auto-select first voice if none selected
      if (voices.length > 0 && !selectedVoice) {
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || voice.name.includes('Microsoft')
        ) || voices[0];
        onVoiceChange(preferredVoice);
      }
    };

    // Load voices immediately
    loadVoices();

    // Also load when voices become available (some browsers load them asynchronously)
    if ('speechSynthesis' in window) {
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }
  }, [language, selectedVoice, onVoiceChange]);

  const handleVoiceSelect = (voiceUri: string) => {
    const voice = availableVoices.find(v => v.voiceURI === voiceUri) || null;
    onVoiceChange(voice);
  };

  if (availableVoices.length === 0) {
    return null;
  }

  // Check if we're showing native language voices or fallback to all voices
  const hasNativeVoices = getVoicesForLanguage(language).length > 0;

  return (
    <div className="voice-selector space-y-2" data-testid="voice-selector">
      <Label htmlFor="voice-select" className="text-sm font-medium">
        {t('voice.selectVoice') || 'Select Voice'}
        {!hasNativeVoices && language !== 'en' && (
          <span className="text-xs text-orange-600 ml-2">
            ({t('voice.noNativeVoices') || 'Using English (India) voices - install native language voices for better experience'})
          </span>
        )}
      </Label>
      <Select 
        value={selectedVoice?.voiceURI || ''} 
        onValueChange={handleVoiceSelect}
        data-testid="voice-select"
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('voice.chooseVoice') || 'Choose a voice'} />
        </SelectTrigger>
        <SelectContent>
          {availableVoices.map((voice) => (
            <SelectItem 
              key={voice.voiceURI} 
              value={voice.voiceURI}
              data-testid={`voice-option-${voice.name}`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{voice.name}</span>
                <span className="text-xs text-muted-foreground">
                  {voice.lang} {voice.localService ? '(Local)' : '(Online)'}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}