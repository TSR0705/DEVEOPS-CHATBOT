import { useEffect, useRef } from 'react';

interface ExecutionPollingOptions {
  commandId?: string;
  executionId?: string;
  onStateChange: (state: 'queued' | 'executing' | 'completed' | 'failed', result?: any) => void;
  enabled: boolean;
}

export function useExecutionPolling({
  commandId,
  executionId,
  onStateChange,
  enabled
}: ExecutionPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastStateRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !executionId) {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    const pollExecution = async () => {
      try {
        const response = await fetch('/api/internal/status');
        if (!response.ok) return;

        const data = await response.json();
        
        if (data.system.currentCommand && 
            (data.system.currentCommand.commandId === commandId || 
             data.system.currentCommand.executionId === executionId)) {
          if (lastStateRef.current !== 'executing') {
            lastStateRef.current = 'executing';
            onStateChange('executing');
          }
          return;
        }

        if (data.system.lastResult && 
            (data.system.lastResult.commandId === commandId ||
             data.system.lastResult.executionId === executionId)) {
          
          const newState = data.system.lastResult.status === 'success' ? 'completed' : 'failed';
          if (lastStateRef.current !== newState) {
            lastStateRef.current = newState;
            
            const proof = {
              executionId: executionId,
              timestamp: data.system.lastResult.timestamp,
              workerStatus: data.system.workerStatus,
              message: data.system.lastResult.message,
              systemTimestamp: data.timestamp,
            };
            
            onStateChange(newState, { 
              ...data.system.lastResult,
              proof 
            });
            
            if (intervalRef.current !== undefined) {
              clearInterval(intervalRef.current);
              intervalRef.current = undefined;
            }
          }
          return;
        }

        if (lastStateRef.current !== 'queued') {
          lastStateRef.current = 'queued';
          onStateChange('queued');
        }

      } catch (error) {
        console.warn('Execution polling error:', error);
      }
    };

    intervalRef.current = setInterval(pollExecution, 2000);
    
    pollExecution();

    return () => {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [enabled, executionId, commandId, onStateChange]);

  return () => {
    if (intervalRef.current !== undefined) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  };
}