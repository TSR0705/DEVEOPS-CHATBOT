// Enhanced Dashboard page with improved layout and styling
import { ChatShellWrapper } from "@/components/chat/ChatShellWrapper";

export default function DashboardPage() {
  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-black">
      {/* Header section - Premium gradient background */}
      <div className="flex-shrink-0 px-6 py-6 border-b border-white/10 bg-gradient-to-r from-black via-black/98 to-black/95 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">
              DeployBot Dashboard
            </h1>
            <p className="text-white/60">
              Monitor and control your Kubernetes cluster in real-time
            </p>
          </div>
          <button className="px-6 py-2.5 bg-gradient-to-r from-[#C084FC] to-[#9BFFB0] text-black font-bold rounded-lg hover:shadow-[0_0_40px_rgba(192,132,252,0.5)] transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap btn-premium">
            <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
            Connect to Cluster
          </button>
        </div>

        {/* Stats Grid - Premium styled with gradients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#9BFFB0]/10 backdrop-blur-3xl p-5 rounded-xl border border-[#9BFFB0]/30 hover:border-[#9BFFB0]/50 transition-all hover:bg-[#9BFFB0]/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  Active Deployments
                </h3>
                <p className="text-2xl font-bold text-[#9BFFB0]">12</p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              <span className="text-[#9BFFB0] font-semibold">↑ 2%</span> from
              last week
            </div>
          </div>

          <div className="bg-[#6EDBD6]/10 backdrop-blur-3xl p-5 rounded-xl border border-[#6EDBD6]/30 hover:border-[#6EDBD6]/50 transition-all hover:bg-[#6EDBD6]/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  Healthy Services
                </h3>
                <p className="text-2xl font-bold text-[#6EDBD6]">24/24</p>
              </div>
              <div className="text-3xl">✓</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              <span className="text-[#6EDBD6] font-semibold">100%</span> uptime
            </div>
          </div>

          <div className="bg-[#D6A65A]/10 backdrop-blur-3xl p-5 rounded-xl border border-[#D6A65A]/30 hover:border-[#D6A65A]/50 transition-all hover:bg-[#D6A65A]/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  CPU Usage
                </h3>
                <p className="text-2xl font-bold text-[#D6A65A]">42%</p>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              <span className="text-[#D6A65A] font-semibold">↓ 3%</span> from
              yesterday
            </div>
          </div>

          <div className="bg-[#C084FC]/10 backdrop-blur-3xl p-5 rounded-xl border border-[#C084FC]/30 hover:border-[#C084FC]/50 transition-all hover:bg-[#C084FC]/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  Network I/O
                </h3>
                <p className="text-2xl font-bold text-[#C084FC]">2.4 Gbps</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              <span className="text-[#C084FC] font-semibold">↑ 0.2</span> Gbps
              from yesterday
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with two sections side-by-side */}
      <div className="flex-1 min-h-0 flex gap-6 px-6 py-6 overflow-hidden bg-gradient-to-b from-black via-black/95 to-black">
        {/* Left sidebar - Activity & Status */}
        <div className="w-80 flex flex-col gap-6 overflow-y-auto">
          {/* Recent Activity */}
          <div className="bg-[#0B0F1A]/60 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col hover:border-white/20 transition-all">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#C084FC]/5 to-transparent">
              <h2 className="font-semibold text-white">Recent Activity</h2>
              <button className="text-xs text-white/60 hover:text-[#C084FC] transition-colors">
                View All →
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {[
                {
                  icon: "●",
                  color: "text-[#9BFFB0]",
                  title: "Deployment completed",
                  subtitle: "frontend-v2",
                  time: "2m ago",
                },
                {
                  icon: "●",
                  color: "text-[#6EDBD6]",
                  title: "New service deployed",
                  subtitle: "api-gateway",
                  time: "15m ago",
                },
                {
                  icon: "●",
                  color: "text-[#D6A65A]",
                  title: "Load test initiated",
                  subtitle: "prod cluster",
                  time: "1h ago",
                },
              ].map((activity, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <span className={`text-lg ${activity.color}`}>●</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-white/50">{activity.subtitle}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cluster Status */}
          <div className="bg-[#0B0F1A]/60 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col hover:border-white/20 transition-all">
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#C084FC]/5 to-transparent">
              <h2 className="font-semibold text-white">Cluster Status</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {[
                {
                  name: "control-plane",
                  status: "Active",
                  detail: "99.9% uptime",
                  color: "bg-[#9BFFB0]",
                },
                {
                  name: "worker-nodes",
                  status: "Active",
                  detail: "4/4 nodes",
                  color: "bg-[#9BFFB0]",
                },
                {
                  name: "storage",
                  status: "Warning",
                  detail: "68% used",
                  color: "bg-[#D6A65A]",
                },
              ].map((node, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                >
                  <span className="text-sm font-medium text-white">
                    {node.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${node.color}`}
                    ></span>
                    <span className="text-xs text-white/60">{node.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Terminal */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="bg-[#0B0F1A]/60 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col h-full hover:border-white/20 transition-all">
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#C084FC]/5 to-transparent">
              <h2 className="font-semibold text-white">Control Terminal</h2>
              <p className="text-xs text-white/50 mt-1">
                Execute commands directly on your cluster
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatShellWrapper />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
