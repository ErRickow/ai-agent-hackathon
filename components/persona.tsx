import {
  Bot,
  Zap,
  Code2,
  GraduationCap,
  Palette,
  Briefcase,
  Heart,
  Gamepad2
} from "lucide-react"
import { intent } from "@/lib/prompts/intent-classifier"
import { quiz } from "@/lib/prompts/quiz-creator"
import { excel } from "@/lib/prompts/excel-expert"

interface Persona {
  id: string
  name: string
  icon: React.ReactNode
  systemPrompt: string
  description: string
}

export const predefinedPersonas: Persona[] = [
{
  id: "assistant",
  name: "AI Assistant",
  icon: <Bot className="w-4 h-4" />,
  systemPrompt: "You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user queries.",
  description: "General purpose helpful assistant",
},
{
  id: "expert",
  name: "Intent Classifier",
  icon: <GraduationCap className="w-4 h-4" />,
  systemPrompt: intent,
  description: "Profesional Classifier",
},
{
  id: "creative",
  name: "Quiz Creator",
  icon: <Palette className="w-4 h-4" />,
  systemPrompt: quiz,
  description: "Profesional Quiz Creator",
},
{
  id: "business",
  name: "Excel Expert",
  icon: <Briefcase className="w-4 h-4" />,
  systemPrompt: excel,
  description: "Excel formulas tailored to their specific data analysis, calculation, or manipulation",
},
{
  id: "coach",
  name: "Life Coach",
  icon: <Heart className="w-4 h-4" />,
  systemPrompt: "You are a supportive life coach. Help users with personal development, motivation, and achieving their goals with empathy and encouragement.",
  description: "Personal development and motivation",
},
{
  id: "gaming",
  name: "Gaming Buddy",
  icon: <Gamepad2 className="w-4 h-4" />,
  systemPrompt: "You are a gaming enthusiast and expert. Help users with game strategies, recommendations, and discuss gaming topics with enthusiasm.",
  description: "Gaming expert and enthusiast",
}, ]