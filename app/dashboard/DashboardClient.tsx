'use client';

import { UserButton, useUser } from "@clerk/nextjs";
import { ChatShellWrapper } from "@/components/chat/ChatShellWrapper";
import { useEffect, useState } from "react";
import Link from "next/link";

interface SystemStatus {
  timestamp: number;
  system: {
    workerStatus: 'idle' | 'executing';
    queueLength: number;
    currentCommand: any;
    lastResult: any;
  };
}

interface HealthStatus {
  timestamp: number;
  status: string;
  system: {
    workerStatus: 'idle' | 'executing';
    queueLength: number;
    mutex: 'free' | 'locked';
    uptimeMs: number;
  };
  execution: {
    currentCommand: any;
    lastResult: any;
    lastError: any;
  };
}

export default function DashboardClient() {
  const { user } = useUser();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRole = user?.publicMetadata?.role as string || 'FREE';
  const isAdmin = userRole === 'ADMIN';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch system status
      const statusResponse = await fetch('/api/internal/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSystemStatus(statusData);
      }

      // Fetch health status
      const healthResponse = await fetch('/api/internal/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthStatus(healthData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (uptimeMs: number) => {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getWorkerStatusColor = (status: string) => {
    switch (status) {
      case 'executing': return 'text-[#D6A65A]';
      case 'idle': return 'text-[#9BFFB0]';
      default: return 'text-white/60';
    }
  };

  const getWorkerStatusIcon = (status: string) => {
    switch (status) {
      case 'executing': return '⚡';
      case 'idle': return '✓';
      default: return '?';
    }
  };

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
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Role:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isAdmin 
                    ? 'bg-[#C084FC]/20 text-[#C084FC] border border-[#C084FC]/30' 
                    : 'bg-[#6EDBD6]/20 text-[#6EDBD6] border border-[#6EDBD6]/30'
                }`}>
                  {userRole}
                </span>
              </div>
              {error && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">⚠️ {error}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Right side - Admin button and User profile */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
              >
                <span className="w-2 h-2 bg-white rounded-full"></span>
                Admin Panel
              </Link>
            )}
            <button 
              onClick={fetchData}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#C084FC] to-[#9BFFB0] text-black font-bold rounded-lg hover:shadow-[0_0_40px_rgba(192,132,252,0.5)] transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap btn-premium disabled:opacity-50"
            >
              <span className={`w-2 h-2 bg-black rounded-full ${loading ? 'animate-pulse' : ''}`}></span>
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </button>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "bg-black border border-white/20",
                  userButtonPopoverActionButton: "text-white hover:bg-white/10",
                  userButtonPopoverActionButtonText: "text-white",
                  userButtonPopoverFooter: "hidden"
                }
              }}
              afterSignOutUrl="/"
            />
          </div>
        </div>

        {/* Real-time Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#9BFFB0]/10 backdrop-blur-3xl p-5 rounded-xl border border-[#9BFFB0]/30 hover:border-[#9BFFB0]/50 transition-all hover:bg-[#9BFFB0]/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  Worker Status
                </h3>
                <p className={`text-2xl font-bold ${getWorkerStatusColor(systemStatus?.system.workerStatus || 'unknown')}`}>
                  {systemStatus?.system.workerStatus || 'Loading...'}
                </p>
              </div>
              <div className="text-3xl">{getWorkerStatusIcon(systemStatus?.system.workerStatus || 'unknown')}</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              System status
            </div>
          </div>

          <div className="bg-[#6EDBD6]/10 backdrop-blur-3xl p-5 rounded-xl border border-[#6EDBD6]/30 hover:border-[#6EDBD6]/50 transition-all hover:bg-[#6EDBD6]/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  Queue Length
                </h3>
                <p className="text-2xl font-bold text-[#6EDBD6]">
                  {systemStatus?.system.queueLength ?? 'N/A'}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              Commands waiting
            </div>
          </div>

          <div className="bg-[#D6A65A]/10 backdrop-blur-3xl p-5 rounded-xl border border-[#D6A65A]/30 hover:border-[#D6A65A]/50 transition-all hover:bg-[#D6A65A]/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  Mutex State
                </h3>
                <p className="text-2xl font-bold text-[#D6A65A]">
                  {healthStatus?.system.mutex || 'Unknown'}
                </p>
              </div>
              <div className="text-3xl">🔒</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              Execution lock
            </div>
          </div>

          <div className="bg-[#C084FC]/10 backdrop-blur-3xl p-5 rounded-xl border border-[#C084FC]/30 hover:border-[#C084FC]/50 transition-all hover:bg-[#C084FC]/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  System Uptime
                </h3>
                <p className="text-2xl font-bold text-[#C084FC]">
                  {healthStatus?.system.uptimeMs ? formatUptime(healthStatus.system.uptimeMs) : 'N/A'}
                </p>
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              Runtime duration
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with two sections side-by-side */}
      <div className="flex-1 min-h-0 flex gap-6 px-6 py-6 overflow-hidden bg-gradient-to-b from-black via-black/95 to-black">
        {/* Left sidebar - Activity & Status */}
        <div className="w-80 flex flex-col gap-6 overflow-y-auto">
          {/* Current Execution */}
          <div className="bg-[#0B0F1A]/60 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col hover:border-white/20 transition-all">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#C084FC]/5 to-transparent">
              <h2 className="font-semibold text-white">Current Execution</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {systemStatus?.system.currentCommand ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <h4 className="text-blue-400 font-medium mb-2">Active Command</h4>
                    <p className="text-white text-sm">
                      Action: {systemStatus.system.currentCommand.action || 'Unknown'}
                    </p>
                    {systemStatus.system.currentCommand.requestedReplicas && (
                      <p className="text-white/70 text-sm">
                        Replicas: {systemStatus.system.currentCommand.requestedReplicas}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">No command currently executing</p>
                </div>
              )}
            </div>
          </div>

          {/* Last Result */}
          <div className="bg-[#0B0F1A]/60 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col hover:border-white/20 transition-all">
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#9BFFB0]/5 to-transparent">
              <h2 className="font-semibold text-white">Last Result</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {systemStatus?.system.lastResult ? (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border ${
                    systemStatus.system.lastResult.status === 'success' 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : systemStatus.system.lastResult.status === 'failed'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${
                        systemStatus.system.lastResult.status === 'success' 
                          ? 'bg-green-400' 
                          : systemStatus.system.lastResult.status === 'failed'
                          ? 'bg-red-400'
                          : 'bg-gray-400'
                      }`}></span>
                      <span className="text-white font-medium capitalize">
                        {systemStatus.system.lastResult.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">
                      {systemStatus.system.lastResult.message}
                    </p>
                    {systemStatus.system.lastResult.timestamp && (
                      <p className="text-white/50 text-xs mt-2">
                        {new Date(systemStatus.system.lastResult.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">No recent results</p>
                </div>
              )}
            </div>
          </div>

          {/* User Role Info */}
          <div className="bg-[#0B0F1A]/60 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col hover:border-white/20 transition-all">
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#C084FC]/5 to-transparent">
              <h2 className="font-semibold text-white">Account Info</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Role</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isAdmin 
                      ? 'bg-[#C084FC]/20 text-[#C084FC] border border-[#C084FC]/30' 
                      : 'bg-[#6EDBD6]/20 text-[#6EDBD6] border border-[#6EDBD6]/30'
                  }`}>
                    {userRole}
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  {isAdmin 
                    ? 'Full access to all features and admin panel' 
                    : 'Limited to 3 free queries, then queue priority'
                  }
                </p>
              </div>
              
              {!isAdmin && (
                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    <span className="text-sm font-medium text-yellow-400">Free Tier</span>
                  </div>
                  <p className="text-xs text-white/60">
                    Commands may be queued during high usage. Upgrade for priority access.
                  </p>
                </div>
              )}
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
                {!isAdmin && (
                  <span className="text-yellow-400 ml-2">
                    • Free tier: 3 queries, then queued
                  </span>
                )}
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