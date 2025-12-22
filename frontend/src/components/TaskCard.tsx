import { useState } from 'react';
import type { PlayerTask } from '../types';

interface TaskCardProps {
  task: PlayerTask;
}

export default function TaskCard({ task }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status = task.status;

  if (!status) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-white font-medium">玩家 {task.fid}</p>
            <p className="text-gray-400 text-sm">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'pending':
        return 'text-yellow-400';
      case 'processing':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'pending':
        return '等待处理';
      case 'processing':
        return '处理中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  const progress = status.progress.total > 0
    ? (status.progress.completed / status.progress.total) * 100
    : 0;

  const playerName = status.results[0]?.nickname || `FID: ${task.fid}`;
  const playerKid = status.results[0]?.kid;

  return (
    <div className="card p-4 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-white font-medium">{playerName}</p>
              {playerKid && (
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                  区服{playerKid}
                </span>
              )}
            </div>
            <p className={`text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-white font-medium">
            {status.progress.completed}/{status.progress.total}
          </p>
          <p className="text-xs text-gray-400">
            成功: {status.progress.succeeded} | 失败: {status.progress.failed}
          </p>
        </div>

        <button className="ml-4 text-gray-400 hover:text-white transition-colors">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 bg-gray-700 h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Expanded Details */}
      {expanded && status.results.length > 0 && (
        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-400 font-medium">处理详情:</p>
          {status.results.map((result, index) => (
            <div
              key={index}
              className={`text-sm p-2 rounded ${
                result.success
                  ? 'bg-green-900/20 border border-green-700/50'
                  : 'bg-red-900/20 border border-red-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={result.success ? 'text-green-300' : 'text-red-300'}>
                  {result.success ? '✓' : '✗'} {result.cdk}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className={`text-xs mt-1 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Task ID */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 font-mono">
          Task ID: {task.taskId}
        </p>
      </div>
    </div>
  );
}
