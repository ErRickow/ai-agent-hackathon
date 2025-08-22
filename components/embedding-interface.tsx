import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Code2 } from "lucide-react";

interface EmbeddingProps {
  isLoading: boolean;
  embeddingText: string;
  setEmbeddingText: (text: string) => void;
  generateEmbedding: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

export default function EmbeddingInterface({
  isLoading,
  embeddingText,
  setEmbeddingText,
  generateEmbedding,
  handleKeyPress,
}: EmbeddingProps) {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Label htmlFor="embedding-text" className="text-base font-semibold">
            Text for Embedding
          </Label>
          <Textarea
            id="embedding-text"
            value={embeddingText}
            onChange={(e) => setEmbeddingText(e.target.value)}
            placeholder="Enter text to generate embeddings..."
            className="mt-2 min-h-[120px]"
            onKeyPress={handleKeyPress}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={generateEmbedding} disabled={!embeddingText.trim() || isLoading} className="w-full" size="lg">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Code2 className="w-4 h-4 mr-2" />
              )}
              Generate Embedding
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate vector embeddings for semantic search</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}