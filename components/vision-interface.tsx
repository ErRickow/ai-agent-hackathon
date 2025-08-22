import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Eye } from "lucide-react";

interface VisionProps {
  isLoading: boolean;
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
  visionPrompt: string;
  setVisionPrompt: (prompt: string) => void;
  analyzeImage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

export default function VisionInterface({
  isLoading,
  uploadedImage,
  setUploadedImage,
  visionPrompt,
  setVisionPrompt,
  analyzeImage,
  handleKeyPress,
}: VisionProps) {
  const fileInputRef = React.useRef < HTMLInputElement > (null);
  
  const handleImageUpload = (e: React.ChangeEvent < HTMLInputElement > ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Label htmlFor="image-upload" className="text-base font-semibold">
            Upload Image
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            ref={fileInputRef}
            className="mt-2"
          />
          {uploadedImage && (
            <img
              src={uploadedImage || "/placeholder.svg"}
              alt="Uploaded"
              className="mt-4 rounded-lg max-w-full h-64 object-cover mx-auto"
            />
          )}
        </div>
        <div>
          <Label htmlFor="vision-prompt" className="text-base font-semibold">
            What do you want to know about this image?
          </Label>
          <Textarea
            id="vision-prompt"
            value={visionPrompt}
            onChange={(e) => setVisionPrompt(e.target.value)}
            placeholder="Ask about the image..."
            className="mt-2"
            onKeyPress={handleKeyPress}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={analyzeImage} disabled={!uploadedImage || !visionPrompt.trim() || isLoading} className="w-full" size="lg">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Analyze Image
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Analyze uploaded image with AI vision</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}