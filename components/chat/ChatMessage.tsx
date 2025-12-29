import type { ChatMessage } from "@/lib/chat/types";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="text-sm text-[#E2E6F0] font-mono p-3 bg-[#0A0E1B]/50 rounded-lg mb-2 border-l-4 border-[#6EDBD6] hover:bg-[#0A0E1B]/70 transition-colors group">
        <span className="text-[#6EDBD6] font-bold">&gt;</span>
        <span className="ml-1 group-hover:text-[#9BFFB0] transition-colors">
          {message.content}
        </span>
        <div className="text-xs text-[#6E748A] mt-1">
          {new Date(message.ts).toLocaleTimeString()}
        </div>
      </div>
    );
  }

  if (message.role === "help") {
    return (
      <div className="text-sm font-mono p-4 rounded-lg mb-2 border-l-4 border-[#C084FC] bg-[#0A0E1B]/50 hover:bg-[#0A0E1B]/70 transition-colors">
        <div className="flex items-start gap-2">
          <span className="text-[#C084FC] text-lg flex-shrink-0">📖</span>
          <div className="flex-1">
            <div className="text-[#C084FC] font-bold mb-3">DeployBot Help Panel</div>
            
            {message.helpContent.sections.map((section, index) => (
              <div key={index} className="mb-4">
                <div className="text-[#9BFFB0] font-bold mb-2 text-xs">
                  {section.title}
                </div>
                <div className="text-[#E2E6F0] space-y-1">
                  {section.content.map((line, lineIndex) => (
                    <div key={lineIndex} className="text-xs leading-relaxed">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="text-xs text-[#6E748A] mt-3 pt-2 border-t border-[rgba(255,255,255,0.1)]">
              Help v{message.helpContent.version} • {new Date(message.ts).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (message.role === "read") {
    if (message.subtype === "STATUS") {
      return (
        <div className="text-sm font-mono p-4 rounded-lg mb-2 border-l-4 border-[#6EDBD6] bg-[#0A0E1B]/50 hover:bg-[#0A0E1B]/70 transition-colors">
          <div className="flex items-start gap-2">
            <span className="text-[#6EDBD6] text-lg flex-shrink-0">📊</span>
            <div className="flex-1">
              <div className="text-[#6EDBD6] font-bold mb-3">System Status</div>
              
              {/* Worker Status */}
              <div className="mb-4">
                <div className="text-[#9BFFB0] font-bold mb-2 text-xs">Worker</div>
                <div className="text-[#E2E6F0] space-y-1 text-xs">
                  <div>State: <span className={`font-bold ${message.system?.worker === 'executing' ? 'text-[#D6A65A]' : 'text-[#9BFFB0]'}`}>
                    {message.system?.worker || 'unknown'}
                  </span></div>
                  <div>Queue length: <span className="text-[#C084FC] font-bold">{message.system?.queueLength || 0}</span></div>
                  {message.system?.uptime && (
                    <div>Uptime: <span className="text-[#6EDBD6]">{Math.floor((message.system.uptime) / 1000)}s</span></div>
                  )}
                </div>
              </div>

              {/* Kubernetes Status */}
              {message.kubernetes && (
                <div className="mb-4">
                  <div className="text-[#9BFFB0] font-bold mb-2 text-xs">Kubernetes</div>
                  <div className="text-[#E2E6F0] space-y-1 text-xs">
                    <div>Deployment: <span className="text-[#6EDBD6] font-bold">{message.kubernetes.deployment}</span></div>
                    <div>Namespace: <span className="text-[#6EDBD6]">{message.kubernetes.namespace}</span></div>
                    <div>Replicas: <span className="text-[#9BFFB0] font-bold">{message.kubernetes.replicas}</span></div>
                    <div>Ready pods: <span className="text-[#9BFFB0] font-bold">{message.kubernetes.readyPods}</span> / <span className="text-[#E2E6F0]">{message.kubernetes.totalPods}</span></div>
                  </div>
                </div>
              )}

              <div className="text-xs text-[#6E748A] mt-2">
                {new Date(message.ts).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (message.subtype === "PODS") {
      return (
        <div className="text-sm font-mono p-4 rounded-lg mb-2 border-l-4 border-[#6EDBD6] bg-[#0A0E1B]/50 hover:bg-[#0A0E1B]/70 transition-colors">
          <div className="flex items-start gap-2">
            <span className="text-[#6EDBD6] text-lg flex-shrink-0">🔍</span>
            <div className="flex-1">
              <div className="text-[#6EDBD6] font-bold mb-3">Pod Information</div>
              
              {message.summary && (
                <div className="mb-3 text-xs">
                  <span className="text-[#9BFFB0]">Deployment:</span> <span className="text-[#E2E6F0]">{message.summary.deployment}</span> • 
                  <span className="text-[#9BFFB0] ml-2">Ready:</span> <span className="text-[#E2E6F0]">{message.summary.ready}/{message.summary.total}</span>
                </div>
              )}

              {/* Pod Table */}
              {message.pods && message.pods.length > 0 ? (
                <div className="bg-[#0F1426] rounded border border-[rgba(255,255,255,0.075)] overflow-hidden">
                  <div className="grid grid-cols-4 gap-2 p-2 bg-[rgba(255,255,255,0.05)] text-xs font-bold text-[#9BFFB0]">
                    <div>Pod Name</div>
                    <div>Status</div>
                    <div>Ready</div>
                    <div>Uptime</div>
                  </div>
                  {message.pods.map((pod, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 p-2 text-xs text-[#E2E6F0] border-t border-[rgba(255,255,255,0.075)]">
                      <div className="truncate">{pod.name}</div>
                      <div className={pod.status === 'Running' ? 'text-[#9BFFB0]' : 'text-[#D6A65A]'}>{pod.status}</div>
                      <div className={pod.ready ? 'text-[#9BFFB0]' : 'text-[#C94A5A]'}>{pod.ready ? '✓' : '✗'}</div>
                      <div className="text-[#6EDBD6]">{pod.uptime > 0 ? `${pod.uptime}s` : '-'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#D6A65A] bg-[#0F1426] p-2 rounded border border-[rgba(255,255,255,0.075)]">
                  No pods found
                </div>
              )}

              <div className="text-xs text-[#6E748A] mt-2">
                {new Date(message.ts).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default read response
    return (
      <div className="text-sm font-mono p-4 rounded-lg mb-2 border-l-4 border-[#6EDBD6] bg-[#0A0E1B]/50 hover:bg-[#0A0E1B]/70 transition-colors">
        <div className="flex items-start gap-2">
          <span className="text-[#6EDBD6] text-lg flex-shrink-0">📊</span>
          <div className="flex-1">
            <div className="text-[#6EDBD6] font-bold mb-1">Read Query Result</div>
            <div className="text-[#E2E6F0] whitespace-pre-line leading-relaxed text-xs mb-2">
              {message.output}
            </div>
            
            {message.data?.suggestion && (
              <div className="text-xs text-[#D6A65A] bg-[#0F1426] p-2 rounded border border-[rgba(255,255,255,0.075)]">
                💡 {message.data.suggestion}
              </div>
            )}
            
            <div className="text-xs text-[#6E748A] mt-2">
              {message.data?.query && `Query: "${message.data.query}" • `}{new Date(message.ts).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (message.role === "dryrun") {
    return (
      <div className="text-sm font-mono p-4 rounded-lg mb-2 border-l-4 border-[#D6A65A] bg-[#0A0E1B]/50 hover:bg-[#0A0E1B]/70 transition-colors">
        <div className="flex items-start gap-2">
          <span className="text-[#D6A65A] text-lg flex-shrink-0">🧪</span>
          <div className="flex-1">
            <div className="text-[#D6A65A] font-bold mb-3 text-base">DRY RUN — No execution</div>
            
            {/* What would happen */}
            <div className="mb-4">
              <div className="text-[#9BFFB0] font-bold mb-2 text-sm">What would happen:</div>
              <div className="text-[#E2E6F0] text-sm ml-4">
                {message.output}
              </div>
            </div>

            {/* Preview details */}
            {message.preview && (
              <div className="mb-4">
                {message.preview.before && message.preview.after && (
                  <div className="bg-[#0F1426] p-3 rounded border border-[rgba(255,255,255,0.075)]">
                    <div className="text-[#9BFFB0] font-bold mb-2 text-sm">Preview:</div>
                    <div className="text-sm space-y-1 ml-4">
                      <div>• Current replicas: <span className="text-[#6EDBD6] font-bold">{message.preview.before.replicas}</span></div>
                      <div>• Target replicas: <span className="text-[#9BFFB0] font-bold">{message.preview.after.replicas}</span></div>
                      {message.preview.direction && (
                        <div>• Direction: <span className={`font-bold ${
                          message.preview.direction === 'scale-up' ? 'text-[#9BFFB0]' : 
                          message.preview.direction === 'scale-down' ? 'text-[#D6A65A]' : 'text-[#6EDBD6]'
                        }`}>
                          {message.preview.direction.replace('-', ' ')}
                        </span></div>
                      )}
                    </div>
                  </div>
                )}
                {message.preview.effect && (
                  <div className="bg-[#0F1426] p-3 rounded border border-[rgba(255,255,255,0.075)] mt-2">
                    <div className="text-[#9BFFB0] font-bold mb-2 text-sm">Effect:</div>
                    <div className="text-sm text-[#E2E6F0] ml-4">{message.preview.effect}</div>
                  </div>
                )}
              </div>
            )}

            {/* Why safe */}
            <div className="mb-4">
              <div className="text-[#9BFFB0] font-bold mb-2 text-sm">Why safe:</div>
              <div className="text-sm space-y-1 ml-4">
                <div className="text-[#E2E6F0]">• Kubernetes not called</div>
                <div className="text-[#E2E6F0]">• No queue</div>
                <div className="text-[#E2E6F0]">• No worker execution</div>
              </div>
            </div>
            
            {/* Warnings */}
            {message.simulation.warnings.length > 0 && (
              <div className="space-y-2 mb-4">
                {message.simulation.warnings.map((warning, index) => (
                  <div key={index} className="text-sm text-[#D6A65A] bg-[#0F1426] p-2 rounded border border-[rgba(255,255,255,0.075)]">
                    {warning}
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-xs text-[#6E748A] mt-3 pt-2 border-t border-[rgba(255,255,255,0.1)]">
              {new Date(message.ts).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (message.role === "system") {
    const getSystemMessageStyle = (state: string) => {
      switch (state) {
        case "accepted":
          return {
            icon: "✓",
            borderColor: "border-[#6EDBD6]",
            bgColor: "bg-[#0A0E1B]/50",
            textColor: "text-[#6EDBD6]",
            title: "Request Accepted"
          };
        case "queued":
          return {
            icon: "⏳",
            borderColor: "border-[#C084FC]",
            bgColor: "bg-[#0A0E1B]/50",
            textColor: "text-[#C084FC]",
            title: "Queued for Execution"
          };
        case "executing":
          return {
            icon: "⚙️",
            borderColor: "border-[#D6A65A]",
            bgColor: "bg-[#0A0E1B]/50",
            textColor: "text-[#D6A65A]",
            title: "Executing Command"
          };
        default:
          return {
            icon: "○",
            borderColor: "border-[#6E748A]",
            bgColor: "bg-[#0A0E1B]/30",
            textColor: "text-[#6E748A]",
            title: "System Message"
          };
      }
    };

    const style = getSystemMessageStyle(message.state);

    return (
      <div className={`text-sm font-mono p-4 rounded-lg mb-2 border-l-4 ${style.borderColor} ${style.bgColor} hover:bg-[#0A0E1B]/70 transition-colors`}>
        <div className="flex items-start gap-2">
          <span className={`${style.textColor} text-lg flex-shrink-0 ${message.state === 'executing' ? 'animate-spin' : ''}`}>
            {style.icon}
          </span>
          <div className="flex-1">
            {/* Timeline Card Header */}
            <div className={`${style.textColor} font-bold mb-3 text-base`}>
              🧠 {message.action === "SCALE" ? "Scaling LoadLab Deployment" : 
                   message.action === "RESTART" ? "Restarting LoadLab Deployment" : 
                   style.title}
            </div>
            
            {/* Step 1: Request accepted */}
            <div className="mb-4">
              <div className="text-[#9BFFB0] font-bold mb-2 text-sm">Step 1: Request accepted</div>
              <div className="text-[#E2E6F0] text-sm space-y-1 ml-4">
                <div>• Action: <span className="text-[#6EDBD6] font-bold">{message.action || 'Unknown'}</span></div>
                {message.intent && (
                  <div>• Direction: <span className={`font-bold ${
                    message.intent === 'scale-up' ? 'text-[#9BFFB0]' : 
                    message.intent === 'scale-down' ? 'text-[#D6A65A]' : 'text-[#6EDBD6]'
                  }`}>
                    {message.intent.replace('-', ' ')}
                  </span></div>
                )}
                {message.after?.replicas && (
                  <div>• Target replicas: <span className="text-[#9BFFB0] font-bold">{message.after.replicas}</span></div>
                )}
              </div>
            </div>

            {/* Step 2: Execution status */}
            <div className="mb-4">
              <div className="text-[#9BFFB0] font-bold mb-2 text-sm">
                Step 2: {message.state === 'accepted' ? 'Waiting in queue' : 
                        message.state === 'queued' ? 'Queued for execution' : 'Execution'}
              </div>
              <div className="text-[#E2E6F0] text-sm space-y-1 ml-4">
                {message.state === 'executing' ? (
                  <>
                    <div>• Worker picked command</div>
                    <div>• Kubernetes API called</div>
                  </>
                ) : (
                  <>
                    <div>• Command validated</div>
                    <div>• Added to execution queue</div>
                  </>
                )}
              </div>
            </div>

            {/* Step 3: Current State */}
            {message.before && (
              <div className="mb-4">
                <div className="text-[#9BFFB0] font-bold mb-2 text-sm">Step 3: Current State</div>
                <div className="text-[#E2E6F0] text-sm space-y-1 ml-4">
                  <div>• Replicas before: <span className="text-[#6EDBD6] font-bold">{message.before.replicas}</span></div>
                  {message.before.readyReplicas !== undefined && (
                    <div>• Ready replicas: <span className="text-[#9BFFB0] font-bold">{message.before.readyReplicas}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Proof */}
            <div className="mb-3">
              <div className="text-[#9BFFB0] font-bold mb-2 text-sm">Step 4: Proof</div>
              <div className="text-[#E2E6F0] text-sm space-y-1 ml-4">
                {message.executionId && <div>• executionId: <span className="text-[#C084FC] font-mono text-xs">{message.executionId}</span></div>}
                <div>• timestamp: <span className="text-[#6EDBD6] text-xs">{new Date(message.ts).toISOString()}</span></div>
                <div>• namespace: <span className="text-[#6EDBD6]">demo</span></div>
                <div>• deployment: <span className="text-[#6EDBD6]">loadlab</span></div>
                <div>• verificationSource: <span className="text-[#9BFFB0]">kubernetes</span></div>
              </div>
            </div>
            
            {/* Meta Information */}
            {message.meta && Object.keys(message.meta).length > 0 && (
              <div className="mt-3 text-xs text-[#6E748A] space-y-1 border-t border-[rgba(255,255,255,0.1)] pt-2">
                {Object.entries(message.meta).map(([key, value]) => (
                  <div key={key}>{key}: {String(value)}</div>
                ))}
              </div>
            )}
            
            <div className="text-xs text-[#6E748A] mt-3 pt-2 border-t border-[rgba(255,255,255,0.1)]">
              {new Date(message.ts).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (message.role === "result") {
    const isSuccess = message.status === "success";
    const icon = isSuccess ? "✅" : "❌";
    const borderColor = isSuccess ? "border-[#9BFFB0]" : "border-[#C94A5A]";
    const bgColor = isSuccess ? "bg-[#0A0E1B]/50" : "bg-[#0A0E1B]/50";
    const titleColor = isSuccess ? "text-[#9BFFB0]" : "text-[#C94A5A]";

    return (
      <div className={`text-sm font-mono p-4 rounded-lg mb-2 border-l-4 ${borderColor} ${bgColor} hover:bg-[#0A0E1B]/70 transition-colors`}>
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0">
            {icon}
          </span>
          <div className="flex-1">
            <div className={`${titleColor} font-bold mb-3 text-base`}>
              {isSuccess ? "Command completed successfully" : "Command failed"}
            </div>
            
            {/* Step 3: Result */}
            <div className="mb-4">
              <div className="text-[#9BFFB0] font-bold mb-2 text-sm">Step 3: Result</div>
              <div className="text-[#E2E6F0] text-sm whitespace-pre-line leading-relaxed ml-4">
                {message.output}
              </div>
            </div>
            
            {/* Show proof of execution for successful commands */}
            {isSuccess && message.proof && (
              <div className="mb-4">
                <div className="text-[#9BFFB0] font-bold mb-2 text-sm">Step 4: Verification</div>
                <div className="bg-[#0F1426] p-3 rounded border border-[rgba(255,255,255,0.075)]">
                  <div className="text-[#9BFFB0] font-bold text-sm mb-2">🔍 Execution Proof</div>
                  <div className="text-[#E2E6F0] text-sm space-y-1 ml-4">
                    {Object.entries(message.proof).map(([key, value]) => (
                      <div key={key}>• {key}: <span className="text-[#6EDBD6]">{String(value)}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-xs text-[#6E748A] mt-3 pt-2 border-t border-[rgba(255,255,255,0.1)]">
              {new Date(message.ts).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
