

import { useRef, useState } from "react";

interface CommandInputProps {
  onSubmit: (command: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const ALLOWED_VERBS = ["scale", "status", "restart", "help"];

export function CommandInput({ onSubmit, disabled, placeholder }: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = inputRef.current?.value.trim() || "";


    if (e.key === "ArrowUp" && history.length > 0) {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      if (inputRef.current) {
        inputRef.current.value = history[newIndex];
      }
      return;
    }

    if (e.key === "ArrowDown" && history.length > 0) {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        if (inputRef.current) {
          inputRef.current.value = history[newIndex];
        }
      } else {
        setHistoryIndex(-1);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();


      if (!value) {
        setError("Command cannot be empty");
        setTimeout(() => setError(""), 3000);
        return;
      }


      const verb = value.split(" ")[0].toLowerCase();


      if (!ALLOWED_VERBS.includes(verb)) {
        setError(`Unknown command: ${verb}. Try: ${ALLOWED_VERBS.join(", ")}`);
        setTimeout(() => setError(""), 4000);
        return;
      }


      setError("");


      setHistory([value, ...history.slice(0, 49)]);
      setHistoryIndex(-1);

      onSubmit(value);


      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-[#0A0E1B] border-t border-[rgba(255,255,255,0.075)] px-4 py-3 font-mono text-sm">
      <div className="flex items-center gap-2 group">
        <span
          className={`text-[#6EDBD6] font-bold transition-colors ${disabled ? "opacity-50" : ""}`}
        >
          &gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder || "Enter command: scale, status, restart, help"}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 bg-transparent text-[#E2E6F0] outline-none placeholder-[#6E748A] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-0 focus:outline-none transition-all group-hover:text-[#9BFFB0]"
          spellCheck="false"
          autoComplete="off"
          aria-label="Command input"
        />
        <button
          className="ml-2 text-[#6E748A] hover:text-[#C94A5A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:text-[#C94A5A]"
          onClick={() => {
            if (inputRef.current && !disabled) {
              inputRef.current.value = "";
              setError("");
              inputRef.current.focus();
            }
          }}
          disabled={disabled}
          aria-label="Clear input"
          title="Clear input (or press Escape)"
        >
          ✕
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-[#C94A5A] pl-6 animate-slide-down font-mono">
          ⚠ {error}
        </div>
      )}
      <div className="mt-1 text-xs text-[#6E748A] pl-6 opacity-60">
        {disabled ? "⊙ Executing..." : "⊗ Ready"}
      </div>
    </div>
  );
}
