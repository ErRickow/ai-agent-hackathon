import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, ImageIcon } from "lucide-react";

interface ImageGenerationProps {
  isLoading: boolean;
  imagePrompt: string;
  setImagePrompt: (prompt: string) => void;
  generateImage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

export default function ImageGenerationInterface({
  isLoading,
  imagePrompt,
  setImagePrompt,
  generateImage,
  handleKeyPress,
}: ImageGenerationProps) {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Label htmlFor="image-prompt" className="text-base font-semibold">
            Image Prompt
          </Label>
          <Textarea
            id="image-prompt"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="mt-2 min-h-[120px]"
            onKeyPress={handleKeyPress}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={generateImage} disabled={!imagePrompt.trim() || isLoading} className="w-full" size="lg">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ImageIcon className="w-4 h-4 mr-2" />
              )}
              Generate Image
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate image from text description</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}