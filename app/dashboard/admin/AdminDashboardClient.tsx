'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CommandInfo {
  id?: string;
  action?: string;
  status?: string;
  timestamp?: number;
  requestedReplicas?: number;
}

interface ResultInfo {
  status?: string;
  message?: string;
  timestamp?: number;
  executionId?: string;
  type?: string;
}

interface SystemStatus {
  timestamp: number;
  system: {
    workerStatus: 'idle' | 'executing';
    queueLength: number;
    currentCommand: CommandInfo | null;
    lastResult: ResultInfo | null;
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
    currentCommand: CommandInfo | null;
    lastResult: ResultInfo | null;
    lastError: ResultInfo | null;
  };
}

export default function AdminDashboardClient() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statusResponse = await fetch('/api/internal/status');
      if (!statusResponse.ok) {
        throw new Error(`Status API error: ${statusResponse.status}`);
      }
      const statusData = await statusResponse.json();
      setSystemStatus(statusData);

      const healthResponse = await fetch('/api/internal/health');
      if (!healthResponse.ok) {
        throw new Error(`Health API error: ${healthResponse.status}`);
      }
      const healthData = await healthResponse.json();
      setHealthStatus(healthData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading && !systemStatus) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-black">
      {/* Header section */}
      <div className="flex-shrink-0 px-6 py-6 border-b border-white/10 bg-gradient-to-r from-red-900/20 via-black/98 to-black/95 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">
              Admin Dashboard
            </h1>
            <p className="text-white/60">
              System administration and monitoring
            </p>
            {error && (
              <p className="text-red-400 text-sm mt-2">
                ⚠️ {error}
              </p>
            )}
          </div>
          
          {/* Right side - Back button, Refresh, and User profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600/20 border border-blue-600/30 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
            >
              ← Back to Dashboard
            </Link>
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
          <div className="bg-green-500/10 backdrop-blur-3xl p-5 rounded-xl border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  Worker Status
                </h3>
                <p className="text-2xl font-bold text-green-400">
                  {systemStatus?.system.workerStatus || 'Unknown'}
                </p>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              Last updated: {systemStatus ? formatTimestamp(systemStatus.timestamp) : 'Never'}
            </div>
          </div>

          <div className="bg-blue-500/10 backdrop-blur-3xl p-5 rounded-xl border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  Queue Length
                </h3>
                <p className="text-2xl font-bold text-blue-400">
                  {systemStatus?.system.queueLength ?? 'N/A'}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              Commands waiting
            </div>
          </div>

          <div className="bg-purple-500/10 backdrop-blur-3xl p-5 rounded-xl border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  Mutex State
                </h3>
                <p className="text-2xl font-bold text-purple-400">
                  {healthStatus?.system.mutex || 'Unknown'}
                </p>
              </div>
              <div className="text-3xl">🔒</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              Execution lock
            </div>
          </div>

          <div className="bg-yellow-500/10 backdrop-blur-3xl p-5 rounded-xl border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-white/70 mb-1 uppercase tracking-wider">
                  Uptime
                </h3>
                <p className="text-2xl font-bold text-yellow-400">
                  {healthStatus?.system.uptimeMs ? formatUptime(healthStatus.system.uptimeMs) : 'N/A'}
                </p>
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              System runtime
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0 flex gap-6 px-6 py-6 overflow-hidden bg-gradient-to-b from-black via-black/95 to-black">
        {/* Current Execution */}
        <div className="w-1/2 flex flex-col gap-6 overflow-y-auto">
          <div className="bg-[#0B0F1A]/60 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-transparent">
              <h2 className="font-semibold text-white">Current Execution</h2>
            </div>
            <div className="p-4">
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
          <div className="bg-[#0B0F1A]/60 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-green-500/10 to-transparent">
              <h2 className="font-semibold text-white">Last Result</h2>
            </div>
            <div className="p-4">
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
                    <p className="text-white/50 text-xs mt-2">
                      {systemStatus.system.lastResult.timestamp ? formatTimestamp(systemStatus.system.lastResult.timestamp) : 'Unknown time'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">No recent results</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Last Error */}
        <div className="w-1/2 flex flex-col gap-6 overflow-y-auto">
          <div className="bg-[#0B0F1A]/60 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent">
              <h2 className="font-semibold text-white">Last Error</h2>
            </div>
            <div className="p-4">
              {healthStatus?.execution.lastError ? (
                <div className="space-y-3">
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="text-red-400 font-medium mb-2">
                      {healthStatus.execution.lastError.type}
                    </h4>
                    <p className="text-white text-sm mb-2">
                      {healthStatus.execution.lastError.message}
                    </p>
                    <p className="text-white/50 text-xs">
                      {healthStatus.execution.lastError.timestamp ? formatTimestamp(healthStatus.execution.lastError.timestamp) : 'Unknown time'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">No recent errors</p>
                </div>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-[#0B0F1A]/60 backdrop-blur-2xl rounded-xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-green-500/10 to-transparent">
              <h2 className="font-semibold text-white">System Health</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className={`p-3 rounded-lg border ${
                  healthStatus?.status === 'healthy' 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${
                      healthStatus?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                    }`}></span>
                    <span className="text-white font-medium">
                      {healthStatus?.status || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">
                    Last health check: {healthStatus ? formatTimestamp(healthStatus.timestamp) : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}