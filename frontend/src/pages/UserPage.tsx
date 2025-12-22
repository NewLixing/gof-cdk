import { useState } from 'react';
import { subscribePlayer, submitGiftCode } from '../lib/subscription-api';

export default function UserPage() {
  const [fid, setFid] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [playerStatus, setPlayerStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [codeStatus, setCodeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fid.trim()) return;

    setIsSubmittingPlayer(true);
    setPlayerStatus(null);

    try {
      const result = await subscribePlayer(fid.trim());
      setPlayerStatus({
        type: 'success',
        message: result.isNew 
          ? `✅ 注册成功！系统正在为您自动领取 ${result.codesTriggered || 0} 个礼包码...` 
          : '✅ 您已经订阅成功！'
      });
      setFid('');
    } catch (error) {
      setPlayerStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '注册失败，请稍后重试'
      });
    } finally {
      setIsSubmittingPlayer(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode.trim()) return;

    setIsSubmittingCode(true);
    setCodeStatus(null);

    try {
      const result = await submitGiftCode(giftCode.trim());
      setCodeStatus({
        type: 'success',
        message: result.isValid 
          ? `✅ 礼包码有效！正在为 ${result.playersTriggered || 0} 位玩家领取...` 
          : '❌ 礼包码无效或已过期'
      });
      setGiftCode('');
    } catch (error) {
      setCodeStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '提交失败，请稍后重试'
      });
    } finally {
      setIsSubmittingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            无尽冬日 礼包码自动领取
          </h1>
          <p className="text-gray-300 text-lg">
            注册账号 · 提交礼包码 · 自动领取
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              全自动
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              零等待
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              AI 加持
            </span>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Player Registration */}
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">注册玩家</h2>
                <p className="text-sm text-gray-400">输入玩家ID订阅自动领取</p>
              </div>
            </div>

            <form onSubmit={handlePlayerSubmit} className="space-y-4">
              <div>
                <label htmlFor="fid" className="block text-sm font-medium text-gray-300 mb-2">
                  玩家ID (FID)
                </label>
                <input
                  id="fid"
                  type="text"
                  value={fid}
                  onChange={(e) => setFid(e.target.value)}
                  placeholder="例如: 123456789"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmittingPlayer}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPlayer || !fid.trim()}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingPlayer ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    注册中...
                  </span>
                ) : (
                  '立即注册'
                )}
              </button>

              {playerStatus && (
                <div className={`p-4 rounded-lg ${
                  playerStatus.type === 'success' 
                    ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
                    : 'bg-red-500/20 border border-red-500/50 text-red-300'
                }`}>
                  {playerStatus.message}
                </div>
              )}
            </form>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>提示：</strong>注册后，系统会自动为您领取所有有效的礼包码！
              </p>
            </div>
          </div>

          {/* Gift Code Submission */}
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎁</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">提交礼包码</h2>
                <p className="text-sm text-gray-400">分享礼包码让所有人受益</p>
              </div>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label htmlFor="giftcode" className="block text-sm font-medium text-gray-300 mb-2">
                  礼包码 (CDK)
                </label>
                <input
                  id="giftcode"
                  type="text"
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                  placeholder="例如: WJDR666"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                  disabled={isSubmittingCode}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingCode || !giftCode.trim()}
                className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingCode ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    验证中...
                  </span>
                ) : (
                  '提交礼包码'
                )}
              </button>

              {codeStatus && (
                <div className={`p-4 rounded-lg ${
                  codeStatus.type === 'success' 
                    ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
                    : 'bg-red-500/20 border border-red-500/50 text-red-300'
                }`}>
                  {codeStatus.message}
                </div>
              )}
            </form>

            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-300">
                💡 <strong>提示：</strong>系统会自动验证礼包码，有效的礼包码会为所有订阅玩家领取！
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 max-w-4xl mx-auto card p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">📖 使用说明</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1️⃣</span>
              </div>
              <h4 className="font-semibold text-white mb-2">注册玩家ID</h4>
              <p className="text-sm text-gray-400">
                输入您的玩家ID完成注册，系统会立即为您领取所有现有礼包码
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2️⃣</span>
              </div>
              <h4 className="font-semibold text-white mb-2">提交礼包码</h4>
              <p className="text-sm text-gray-400">
                发现新礼包码？提交给系统，让所有注册玩家都能领取
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">3️⃣</span>
              </div>
              <h4 className="font-semibold text-white mb-2">全自动领取</h4>
              <p className="text-sm text-gray-400">
                系统自动处理，AI智能识别验证码，无需任何操作
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>
            开源项目 · 仅供学习研究使用 · 请遵守相关法律法规和游戏服务条款
          </p>
          <p className="mt-2">
            Powered by Cloudflare Pages + Workers + Workers AI
          </p>
        </footer>
      </div>
    </div>
  );
}
