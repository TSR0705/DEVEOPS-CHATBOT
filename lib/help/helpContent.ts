interface HelpSection {
  title: string;
  content: string[];
}

interface HelpResponse {
  sections: HelpSection[];
  version: string;
  timestamp: number;
}

export function generateHelpContent(userRole: string): HelpResponse {
  const isAdmin = userRole === "ADMIN";
  
  return {
    version: "1.0.0",
    timestamp: Date.now(),
    sections: [
      {
        title: "Available Commands",
        content: [
          "• help - Show this help panel",
          "• status - Show current system status",
          "• show pods - Display LoadLab pod information",
          "• scale loadlab to N - Scale LoadLab to N replicas (1-5)",
          "• restart loadlab - Restart LoadLab deployment",
          "• dry run <command> - Simulate command without execution"
        ]
      },
      {
        title: "Command Examples",
        content: [
          "status",
          "scale loadlab to 3",
          "restart loadlab", 
          "dry run scale loadlab to 5",
          "show pods"
        ]
      },
      {
        title: "What Happens When You Run Commands",
        content: [
          "📖 READ commands (status, show): Execute immediately, no queue",
          "🧪 DRY RUN commands: Validate and simulate, no actual changes",
          "⚡ EXECUTE commands: Queue → Worker → Kubernetes → Real changes",
          "❌ INVALID commands: Immediate error with suggestions"
        ]
      },
      {
        title: "Replica Limits",
        content: [
          "• Minimum replicas: 1",
          "• Maximum replicas: 5", 
          "• Invalid replica counts will be rejected",
          "• Current replica count shown in status"
        ]
      },
      {
        title: `Role-Based Behavior (You are: ${userRole})`,
        content: isAdmin ? [
          "🔑 ADMIN privileges:",
          "• Unlimited command quota",
          "• Highest execution priority (queue position 1)",
          "• Access to all system endpoints",
          "• Real-time execution tracking"
        ] : [
          "👤 FREE user limits:",
          "• 3 commands per session quota",
          "• Standard execution priority (queue position varies)",
          "• Commands queued when quota exceeded",
          "• Real-time execution tracking"
        ]
      },
      {
        title: "Execution Proof",
        content: [
          "✅ All EXECUTE commands provide proof:",
          "• Before/After replica counts",
          "• Kubernetes API responses", 
          "• Execution timestamps",
          "• Worker execution logs",
          "• Real pod status verification"
        ]
      }
    ]
  };
}