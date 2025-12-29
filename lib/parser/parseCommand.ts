import { ParsedCommand, CommandType, ExecuteAction } from "../scheduler/types";


export function parseCommand(input: string): ParsedCommand {
  const rawText = input.trim().toLowerCase();

  // 1. HELP commands - detect first
  if (rawText === "help" || rawText.includes("help")) {
    return {
      type: "HELP" as CommandType,
      rawText,
    };
  }

  // 2. DRY_RUN commands - detect before EXECUTE
  if (
    rawText.startsWith("dry run") ||
    rawText.includes("what happens") ||
    rawText.includes("what if") ||
    rawText.includes("simulate")
  ) {
    // Extract the actual command from dry run prefix
    const dryRunCommand = rawText.replace(/^dry\s+run\s+/, "").trim();
    
    if (dryRunCommand.includes("scale")) {
      const scaleMatch = dryRunCommand.match(/scale.*?to\s+(\d+)/i);
      if (scaleMatch) {
        const targetReplicas = parseInt(scaleMatch[1]);
        if (!isNaN(targetReplicas)) {
          return {
            type: "DRY_RUN" as CommandType,
            action: "SCALE" as ExecuteAction,
            targetReplicas,
            rawText,
          };
        }
      }
    }
    
    if (dryRunCommand.includes("restart")) {
      return {
        type: "DRY_RUN" as CommandType,
        action: "RESTART" as ExecuteAction,
        rawText,
      };
    }
    
    // Generic dry run
    return {
      type: "DRY_RUN" as CommandType,
      rawText,
    };
  }

  // 3. EXECUTE commands - scale
  if (rawText.includes("scale")) {
    const scaleMatch = rawText.match(/scale.*?to\s+(\d+)/i);
    if (scaleMatch) {
      const targetReplicas = parseInt(scaleMatch[1]);
      if (!isNaN(targetReplicas)) {
        return {
          type: "EXECUTE" as CommandType,
          action: "SCALE" as ExecuteAction,
          targetReplicas,
          rawText,
        };
      }
    }
  }

  // 4. EXECUTE commands - restart
  if (rawText.includes("restart")) {
    return {
      type: "EXECUTE" as CommandType,
      action: "RESTART" as ExecuteAction,
      rawText,
    };
  }

  // 5. READ commands - everything else
  return {
    type: "READ" as CommandType,
    rawText,
  };
}
