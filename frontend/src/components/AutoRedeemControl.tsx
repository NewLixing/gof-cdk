import { useState } from 'react';
import { triggerAutoRedeem } from '../lib/subscription-api';

export default function AutoRedeemControl() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastResults, setLastResults] = useState<any[]>([]);

  const handleTrigger = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    setLastResults([]);

    try {
      const result = await triggerAutoRedeem();

      if (result.success) {
        setSuccess(result.message || '自动领取完成');
        setLastResults(result.data || []);
      } else {
        setError(result.error || '自动领取失败');
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
        <span className="text-yellow-400">⚡</span>
        自动领取控制
      </h2>

      <div className="space-y-4">
        <p className="text-gray-300 text-sm">
          点击按钮将为所有订阅玩家自动领取所有有效礼包码
        </p>

        <button
          onClick={handleTrigger}
          disabled={loading}
          className="btn-primary w-full text-lg py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              自动领取中...
            </>
          ) : (
            <>
              <span>🚀</span>
              立即执行自动领取
            </>
          )}
        </button>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* Last Results Summary */}
        {lastResults.length > 0 && (
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-white font-medium mb-2">
              本次领取结果 ({lastResults.length})
            </p>
            <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
              {lastResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    result.success
                      ? 'bg-green-900/20 text-green-300'
                      : 'bg-red-900/20 text-red-300'
                  }`}
                >
                  {result.success ? '✓' : '✗'} {result.nickname || result.fid} - {result.code}
                  <span className="text-gray-400 ml-2">({result.message})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-400 space-y-1 bg-blue-900/10 p-3 rounded">
          <p>💡 提示：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>系统会自动跳过已领取的礼包码</li>
            <li>检测到过期礼包码会自动移至过期列表</li>
            <li>每个玩家处理间隔2秒，避免触发风控</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
