"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Settings } from "lucide-react";

interface PersonaSettingsProps {
  selectedPersona: {
    id: string;
    name: string;
    icon: React.ReactNode;
    systemPrompt: string;
    description: string;
  };
  predefinedPersonas: any[];
  customSystemPrompt: string;
  setCustomSystemPrompt: (prompt: string) => void;
  useCustomPrompt: boolean;
  setUseCustomPrompt: (use: boolean) => void;
  onSelectPersona: (persona: any) => void;
}

export default function PersonaSettingsDialog({
  selectedPersona,
  predefinedPersonas,
  customSystemPrompt,
  setCustomSystemPrompt,
  useCustomPrompt,
  setUseCustomPrompt,
  onSelectPersona,
}: PersonaSettingsProps) {
  const [isPersonaDialogOpen, setIsPersonaDialogOpen] = React.useState(false);
  
  return (
    <Dialog open={isPersonaDialogOpen} onOpenChange={setIsPersonaDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full bg-transparent">
          <Settings className="w-4 h-4 mr-2" />
          Configure Persona
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Persona Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold">Choose Persona</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {predefinedPersonas.map((persona) => (
                <Card
                  key={persona.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedPersona.id === persona.id && !useCustomPrompt
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-secondary/50"
                  }`}
                  onClick={() => onSelectPersona(persona)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">{persona.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{persona.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{persona.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="custom-prompt"
                checked={useCustomPrompt}
                onChange={(e) => setUseCustomPrompt(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="custom-prompt" className="text-base font-semibold">
                Use Custom System Prompt
              </Label>
            </div>
            <Textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              placeholder="Enter your custom system prompt here..."
              className="min-h-[120px] font-mono text-sm"
              disabled={!useCustomPrompt}
            />
          </div>
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Current System Prompt:</h4>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              {useCustomPrompt ? customSystemPrompt || "No custom prompt set" : selectedPersona.systemPrompt}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPersonaDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsPersonaDialogOpen(false)}>Apply Settings</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}