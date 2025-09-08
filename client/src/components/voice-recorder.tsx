import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square, Play, Pause, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcript?: string) => void;
  onTranscriptChange?: (transcript: string) => void;
  className?: string;
}

export default function VoiceRecorder({ 
  onRecordingComplete, 
  onTranscriptChange,
  className 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(prev => {
          const updated = (prev + finalTranscript).trim();
          onTranscriptChange?.(updated);
          return updated;
        });
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Transcription Error",
          description: "Speech recognition failed. Recording will continue without transcription.",
          variant: "destructive",
        });
      };
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onTranscriptChange, toast]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start speech recognition
      if (recognitionRef.current) {
        setIsTranscribing(true);
        recognitionRef.current.start();
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsTranscribing(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly about the plant's medicinal uses and properties.",
      });
      
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      toast({
        title: "Recording Stopped",
        description: "You can now review and submit your recording.",
      });
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const submitRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, transcript);
      
      // Reset state
      setAudioBlob(null);
      setAudioUrl(null);
      setTranscript("");
      setRecordingTime(0);
      
      toast({
        title: "Recording Submitted",
        description: "Your voice contribution has been saved.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-medium text-foreground mb-2" data-testid="voice-recorder-title">
              Voice Contribution
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Record your knowledge about medicinal plants in your own voice
            </p>
          </div>
          
          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3"
                data-testid="start-recording-button"
              >
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
            )}
            
            {isRecording && (
              <>
                <div className="flex items-center space-x-2 text-destructive">
                  <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                  <span className="font-mono text-sm" data-testid="recording-time">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <Button
                  onClick={stopRecording}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  data-testid="stop-recording-button"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              </>
            )}
            
            {audioBlob && !isRecording && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={playRecording}
                  variant="outline"
                  data-testid="play-recording-button"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Duration: {formatTime(recordingTime)}
                </span>
                <Button
                  onClick={submitRecording}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="submit-recording-button"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Use Recording
                </Button>
              </div>
            )}
          </div>
          
          {/* Live Transcription */}
          {(isTranscribing || transcript) && (
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-foreground">Live Transcription:</span>
                {isTranscribing && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
              <div className="text-sm text-foreground min-h-[40px] whitespace-pre-wrap" data-testid="transcript-text">
                {transcript || (isTranscribing ? "Listening..." : "No transcription available")}
              </div>
            </div>
          )}
          
          {/* Hidden audio element for playback */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
          
          {/* Recording tips */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 Tips for better recording:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Speak clearly and at a moderate pace</li>
              <li>Include plant name, uses, and preparation methods</li>
              <li>Mention any traditional knowledge or regional names</li>
              <li>Record in a quiet environment</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}