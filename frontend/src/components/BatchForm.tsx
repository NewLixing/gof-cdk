import { useState } from 'react';
import { submitBatchTask } from '../lib/api';
import type { PlayerTask } from '../types';

interface BatchFormProps {
  onTasksCreated: (tasks: PlayerTask[]) => void;
}

export default function BatchForm({ onTasksCreated }: BatchFormProps) {
  const [fids, setFids] = useState('');
  const [cdks, setCdks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Parse input
    const fidList = fids.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const cdkList = cdks.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

    // Validate
    if (fidList.length === 0) {
      setError('请至少输入一个玩家ID');
      return;
    }

    if (cdkList.length === 0) {
      setError('请至少输入一个礼包码');
      return;
    }

    setLoading(true);

    try {
      const result = await submitBatchTask(fidList, cdkList);

      if (result.success && result.data) {
        const tasks: PlayerTask[] = result.data.map(item => ({
          fid: item.fid,
          taskId: item.taskId,
        }));

        onTasksCreated(tasks);
        setSuccess(`成功创建 ${tasks.length} 个任务！`);
        
        // Clear form after 2 seconds
        setTimeout(() => {
          setFids('');
          setCdks('');
          setSuccess('');
        }, 2000);
      } else {
        setError(result.error || '提交失败，请重试');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-blue-400">📝</span>
        批量提交任务
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Player IDs Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            玩家ID列表
            <span className="text-gray-500 ml-2 text-xs">
              (多个ID用逗号或换行分隔)
            </span>
          </label>
          <textarea
            value={fids}
            onChange={(e) => setFids(e.target.value)}
            placeholder="123456789
987654321
..."
            rows={4}
            className="input-field font-mono text-sm"
            disabled={loading}
          />
        </div>

        {/* CDK Codes Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            礼包码列表
            <span className="text-gray-500 ml-2 text-xs">
              (多个礼包码用逗号或换行分隔)
            </span>
          </label>
          <textarea
            value={cdks}
            onChange={(e) => setCdks(e.target.value)}
            placeholder="WJDR666
WJDR888
..."
            rows={6}
            className="input-field font-mono text-sm"
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-900/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-lg py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              处理中...
            </>
          ) : (
            <>
              <span>🚀</span>
              开始批量处理
            </>
          )}
        </button>

        {/* Info */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>💡 提示：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>系统会为每个玩家创建独立任务</li>
            <li>验证码由 Cloudflare Workers AI 自动识别</li>
            <li>处理结果实时更新，请在右侧查看进度</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
