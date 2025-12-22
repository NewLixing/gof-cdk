import { useState, useEffect } from 'react';
import { addGiftCode, getGiftCodes, deleteGiftCode } from '../lib/subscription-api';
import type { GiftCode } from '../types';

export default function GiftCodeManagement() {
  const [activeCodes, setActiveCodes] = useState<GiftCode[]>([]);
  const [expiredCodes, setExpiredCodes] = useState<GiftCode[]>([]);
  const [newCode, setNewCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    loadGiftCodes();
  }, []);

  const loadGiftCodes = async () => {
    const result = await getGiftCodes();
    if (result.success && result.data) {
      setActiveCodes(result.data.active);
      setExpiredCodes(result.data.expired);
    }
  };

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newCode.trim()) {
      setError('请输入礼包码');
      return;
    }

    setLoading(true);

    try {
      const result = await addGiftCode(newCode.trim(), description.trim() || undefined);

      if (result.success && result.data) {
        setSuccess(`成功添加礼包码 ${result.data.code}`);
        setNewCode('');
        setDescription('');
        await loadGiftCodes();
      } else {
        setError(result.error || '添加失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async (code: string) => {
    if (!confirm(`确认删除礼包码 ${code}？`)) {
      return;
    }

    const result = await deleteGiftCode(code);
    if (result.success) {
      setSuccess('删除成功');
      await loadGiftCodes();
    } else {
      setError(result.error || '删除失败');
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-purple-400">🎁</span>
        礼包码管理
      </h2>

      {/* Add Code Form */}
      <form onSubmit={handleAddCode} className="mb-6 space-y-3">
        <input
          type="text"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="输入礼包码"
          className="input-field w-full"
          disabled={loading}
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="备注（可选）"
          className="input-field w-full"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? '添加中...' : '添加礼包码'}
        </button>
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

      {/* Toggle between active and expired */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowExpired(false)}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            !showExpired
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          有效 ({activeCodes.length})
        </button>
        <button
          onClick={() => setShowExpired(true)}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            showExpired
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          已过期 ({expiredCodes.length})
        </button>
      </div>

      {/* Codes List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {!showExpired ? (
          // Active Codes
          activeCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无有效礼包码
            </div>
          ) : (
            activeCodes.map((code) => (
              <div
                key={code.code}
                className="bg-green-900/20 border border-green-700/50 p-4 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-mono font-medium">{code.code}</p>
                  {code.description && (
                    <p className="text-gray-400 text-sm">{code.description}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    添加于: {new Date(code.addedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCode(code.code)}
                  className="text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded hover:bg-red-900/20"
                >
                  删除
                </button>
              </div>
            ))
          )
        ) : (
          // Expired Codes
          expiredCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无过期礼包码
            </div>
          ) : (
            expiredCodes.map((code) => (
              <div
                key={code.code}
                className="bg-red-900/20 border border-red-700/50 p-4 rounded-lg flex items-center justify-between opacity-75"
              >
                <div>
                  <p className="text-white font-mono font-medium line-through">{code.code}</p>
                  {code.description && (
                    <p className="text-gray-400 text-sm">{code.description}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    过期于: {code.expiredAt ? new Date(code.expiredAt).toLocaleString('zh-CN') : '未知'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCode(code.code)}
                  className="text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded hover:bg-red-900/20"
                >
                  删除
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
