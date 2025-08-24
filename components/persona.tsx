import {
  Bot,
  Zap,
  Code2,
  Frown,
  Palette,
  PanelsTopLeft,
  Trello,
  Radical
} from "lucide-react"
import { intent } from "@/lib/prompts/intent-classifier"
import { excel } from "@/lib/prompts/excel-expert"
import { Merdeka } from "@/lib/prompts/merdeka-ai"
import { agentAssistant } from "@/lib/prompts/assistant"
import {latexLegend} from "@/lib/prompts/latex-legend"

export interface Persona {
  id: string
  name: string
  icon: React.ReactNode
  systemPrompt: string
  description: string
  color: string
}

export const predefinedPersonas: Persona[] = [
{
  id: "assistant",
  name: "Agentic Merdeka",
  icon: <Bot className="w-4 h-4" />,
  systemPrompt: Merdeka,
  description: "General task Agent Hackathon",
  color: "#6366F1",
},
{
  id: "expert",
  name: "Ethical Dilema",
  icon: <Frown className="w-4 h-4" />,
  systemPrompt: "Help the user navigate a complex ethical dilemma by identifying core ethical principles, exploring different ethical frameworks, considering potential consequences, acknowledging complexity, encouraging personal reflection, and offering additional resources. Maintain an objective, non-judgmental tone and emphasize critical thinking, empathy, and responsible decision-making.",
  description: "Help the user think through complex ethical dilemmas and provide different perspectives.",
  color: "#10B981",
},
{
  id: "creative",
  name: "Coding Clarifier",
  icon: <Code2 className="w-4 h-4" />,
  systemPrompt: "Your task is to take the code snippet provided and explain it in simple, easy-to-understand language. Break down the code’s functionality, purpose, and key components. Use analogies, examples, and plain terms to make the explanation accessible to someone with minimal coding knowledge. Avoid using technical jargon unless absolutely necessary, and provide clear explanations for any jargon used. The goal is to help the reader understand what the code does and how it works at a high level.",
  description: "Simplify and explain complex code in plain language.",
  color: "#EC4899",
},
{
  id: "business",
  name: "Excel Expert",
  icon: <Trello className="w-4 h-4" />,
  systemPrompt: excel,
  description: "Excel formulas tailored to their specific data analysis, calculation, or manipulation",
  color: "#059669",
},
{
  id: "coach",
  name: "Website Wizard",
  icon: <PanelsTopLeft className="w-4 h-4" />,
  systemPrompt: "Your task is to create a one-page website based on the given specifications, delivered as an HTML file with embedded JavaScript and CSS. The website should incorporate a variety of engaging and interactive design features, such as drop-down menus, dynamic text and content, clickable buttons, and more. Ensure that the design is visually appealing, responsive, and user-friendly. The HTML, CSS, and JavaScript code should be well-structured, efficiently organized, and properly commented for readability and maintainability.",
  description: "Create one-page websites based on user specifications.",
  color: "#F97316",
},
{
  id: "gaming",
  name: "Latex Legend",
  icon: <Radical className="w-4 h-4" />,
  systemPrompt: latexLegend,
  description: "Write LaTeX documents, generating code for mathematical equations, tables, and more.",
  color: "#8B5CF6",
}, ]