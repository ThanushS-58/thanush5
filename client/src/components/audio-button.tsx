import { useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { speakText } from "@/lib/tts";
import { useLanguage } from "@/contexts/language-context";

interface AudioButtonProps {
  text: string;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
  className?: string;
  selectedVoice?: SpeechSynthesisVoice | null;
}

export default function AudioButton({ 
  text, 
  variant = "accent", 
  size = "md", 
  className,
  selectedVoice,
  ...props 
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { language, t } = useLanguage();

  const handleClick = async () => {
    if (isPlaying) {
      // Stop current speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      try {
        await speakText(text, language, selectedVoice);
      } catch (error) {
        console.error('Text-to-speech failed:', error);
      } finally {
        setIsPlaying(false);
      }
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-primary text-primary-foreground hover:bg-primary/90";
      case "secondary":
        return "bg-secondary text-secondary-foreground hover:bg-secondary/90";
      case "accent":
      default:
        return "bg-accent text-accent-foreground hover:bg-accent/90";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-sm";
      case "lg":
        return "px-6 py-3 text-base";
      case "md":
      default:
        return "px-4 py-2 text-sm";
    }
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "audio-button font-medium flex items-center space-x-2 transition-all duration-200",
        getVariantStyles(),
        getSizeStyles(),
        className
      )}
      disabled={!text}
      {...props}
    >
      {isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      <span>{isPlaying ? t('audio.stop') || "Stop" : t('audio.listen') || "Listen"}</span>
    </Button>
  );
}
