import { ParsedCommand, CommandType, ExecuteAction } from "../scheduler/types";

// Parse raw user input into structured command
// Defaulting to READ is safer as it prevents unintended execution
export function parseCommand(input: string): ParsedCommand {
  const rawText = input.trim().toLowerCase();
  
  // DRY_RUN commands - simulation intent (checked first to prevent misclassification)
  if (rawText.includes("what happens") || 
      rawText.includes("what if") || 
      rawText.includes("simulate")) {
    return {
      type: "DRY_RUN" as CommandType,
      rawText
    };
  }
  
  // EXECUTE commands - explicit intent only
  if (rawText.includes("scale")) {
    const scaleMatch = rawText.match(/scale.*?to\s+(\d+)/i);
    if (scaleMatch) {
      const targetReplicas = parseInt(scaleMatch[1]);
      if (!isNaN(targetReplicas)) {
        return {
          type: "EXECUTE" as CommandType,
          action: "SCALE" as ExecuteAction,
          targetReplicas,
          rawText
        };
      }
    }
  }
  
  if (rawText.includes("restart")) {
    return {
      type: "EXECUTE" as CommandType,
      action: "RESTART" as ExecuteAction,
      rawText
    };
  }
  
  // READ commands - default safe behavior for ambiguous input
  return {
    type: "READ" as CommandType,
    rawText
  };
}
