import { useState, useEffect } from 'react';
import { subscribePlayer, getPlayers, unsubscribePlayer } from '../lib/subscription-api';
import type { SubscribedPlayer } from '../types';

interface PlayerManagementProps {
  isAdminMode?: boolean;
}

export default function PlayerManagement({ isAdminMode = false }: PlayerManagementProps) {
  const [players, setPlayers] = useState<SubscribedPlayer[]>([]);
  const [newFid, setNewFid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Remove unused variable warning by using it
  console.log('Admin mode:', isAdminMode);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    const result = await getPlayers();
    if (result.success && result.data) {
      setPlayers(result.data);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newFid.trim()) {
      setError('请输入玩家ID');
      return;
    }

    setLoading(true);

    try {
      const result = await subscribePlayer(newFid.trim());

      if (result.success && result.data) {
        setSuccess(`成功订阅玩家 ${result.data.nickname || result.data.fid}`);
        setNewFid('');
        await loadPlayers();
      } else {
        setError(result.error || '订阅失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (fid: string) => {
    if (!confirm('确认取消订阅该玩家？')) {
      return;
    }

    const result = await unsubscribePlayer(fid);
    if (result.success) {
      setSuccess('取消订阅成功');
      await loadPlayers();
    } else {
      setError(result.error || '取消订阅失败');
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-blue-400">👥</span>
        玩家订阅管理
      </h2>

      {/* Add Player Form */}
      <form onSubmit={handleSubscribe} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newFid}
            onChange={(e) => setNewFid(e.target.value)}
            placeholder="输入玩家ID"
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6"
          >
            {loading ? '订阅中...' : '订阅'}
          </button>
        </div>
      </form>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Players List */}
      <div className="space-y-2">
        <p className="text-gray-400 text-sm mb-2">
          已订阅 {players.length} 个玩家
        </p>
        
        {players.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无订阅玩家
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.fid}
                className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-medium">
                    {player.nickname || `玩家 ${player.fid}`}
                  </p>
                  <p className="text-gray-400 text-sm">
                    FID: {player.fid}
                    {player.kid && ` • 区服: ${player.kid}`}
                  </p>
                  {player.lastRedemptionAt && (
                    <p className="text-gray-500 text-xs mt-1">
                      最后领取: {new Date(player.lastRedemptionAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleUnsubscribe(player.fid)}
                  className="text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded hover:bg-red-900/20"
                >
                  取消订阅
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
