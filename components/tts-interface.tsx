import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Mic } from "lucide-react";

interface TTSProps {
  isLoading: boolean;
  ttsText: string;
  setTtsText: (text: string) => void;
  generateSpeech: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

export default function TTSInterface({
  isLoading,
  ttsText,
  setTtsText,
  generateSpeech,
  handleKeyPress,
}: TTSProps) {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Label htmlFor="tts-text" className="text-base font-semibold">
            Text to Speech
          </Label>
          <Textarea
            id="tts-text"
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="Enter text to convert to speech..."
            className="mt-2 min-h-[120px]"
            onKeyPress={handleKeyPress}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={generateSpeech} disabled={!ttsText.trim() || isLoading} className="w-full" size="lg">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
              Generate Speech
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Convert text to natural speech audio</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}