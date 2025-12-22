import { useState } from 'react';

interface TestLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'request' | 'response';
  message: string;
  data?: unknown;
}

export default function TestTool() {
  const [fid, setFid] = useState('');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<TestLog[]>([]);

  const addLog = (type: TestLog['type'], message: string, data?: unknown) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(prev => [...prev, { timestamp, type, message, data }]);
  };

  const handleTest = async () => {
    if (!fid.trim() || !code.trim()) return;

    setIsRunning(true);
    setLogs([]);
    addLog('info', '开始测试流程...');

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      
      // Step 1: Get player info
      addLog('info', `正在获取玩家信息... FID: ${fid}`);
      addLog('request', 'GET /api/test/player-info', { fid });
      
      const playerInfoRes = await fetch(`${apiBase}/api/test/player-info?fid=${fid}`);
      const playerInfo = await playerInfoRes.json();
      
      addLog('response', '玩家信息获取成功', playerInfo);

      if (!playerInfo.success) {
        addLog('error', `获取玩家信息失败: ${playerInfo.error || '未知错误'}`);
        return;
      }

      // Step 2: Get captcha
      addLog('info', '正在获取验证码...');
      addLog('request', 'POST /api/test/get-captcha', { fid, code });
      
      const captchaRes = await fetch(`${apiBase}/api/test/get-captcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid, code })
      });
      const captchaData = await captchaRes.json();
      
      addLog('response', '验证码获取成功', {
        captchaId: captchaData.captchaId,
        imagePreview: captchaData.image ? `${captchaData.image.substring(0, 50)}...` : null
      });

      if (!captchaData.success) {
        addLog('error', `获取验证码失败: ${captchaData.error || '未知错误'}`);
        return;
      }

      // Step 3: Recognize captcha with AI
      addLog('info', '正在使用 Workers AI 识别验证码...');
      addLog('request', 'POST /api/test/recognize-captcha', {
        image: 'base64_image_data',
        model: '@cf/llava-hf/llava-1.5-7b-hf'
      });
      
      const recognizeRes = await fetch(`${apiBase}/api/test/recognize-captcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: captchaData.image })
      });
      const recognizeData = await recognizeRes.json();
      
      addLog('response', 'AI 识别结果', {
        recognized: recognizeData.captcha,
        rawResponse: recognizeData.rawAIResponse
      });

      if (!recognizeData.success) {
        addLog('error', `验证码识别失败: ${recognizeData.error || '未知错误'}`);
        return;
      }

      addLog('success', `✅ 验证码识别成功: ${recognizeData.captcha}`);

      // Step 4: Submit redemption
      addLog('info', '正在提交领取请求...');
      addLog('request', 'POST /api/test/redeem', {
        fid,
        code,
        captchaId: captchaData.captchaId,
        captcha: recognizeData.captcha
      });
      
      const redeemRes = await fetch(`${apiBase}/api/test/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          code,
          captchaId: captchaData.captchaId,
          captcha: recognizeData.captcha,
          playerInfo: playerInfo.data
        })
      });
      const redeemData = await redeemRes.json();
      
      addLog('response', '领取结果', redeemData);

      if (redeemData.success) {
        addLog('success', `✅ 领取成功！${redeemData.message || ''}`);
      } else {
        addLog('error', `❌ 领取失败: ${redeemData.error || redeemData.message || '未知错误'}`);
      }

    } catch (error) {
      addLog('error', `测试过程发生错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      addLog('info', '测试流程结束');
    }
  };

  const getLogColor = (type: TestLog['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'request': return 'text-blue-400';
      case 'response': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getLogIcon = (type: TestLog['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'request': return '📤';
      case 'response': return '📥';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Test Form */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">🧪 测试领取流程</h2>
        
        <form onSubmit={(e) => { e.preventDefault(); handleTest(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              玩家ID (FID)
            </label>
            <input
              type="text"
              value={fid}
              onChange={(e) => setFid(e.target.value)}
              placeholder="输入玩家ID"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              礼包码 (CDK)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="输入礼包码"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white uppercase"
              disabled={isRunning}
            />
          </div>

          <button
            type="submit"
            disabled={isRunning || !fid.trim() || !code.trim()}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                测试中...
              </span>
            ) : (
              '开始测试'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-300">
            💡 <strong>提示：</strong>此工具用于测试完整的领取流程，包括玩家信息获取、验证码识别和礼包领取。
          </p>
        </div>
      </div>

      {/* Right: Logs */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">📋 测试日志</h3>
          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className="text-sm text-gray-400 hover:text-white"
            >
              清空
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              暂无日志，请开始测试
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm">{getLogIcon(log.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                      <span className={`text-xs font-medium ${getLogColor(log.type)}`}>
                        {log.type.toUpperCase()}
                      </span>
                    </div>
                    <p className={`text-sm ${getLogColor(log.type)} break-words`}>
                      {log.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
