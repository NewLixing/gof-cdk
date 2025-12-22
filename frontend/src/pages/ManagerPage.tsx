import { useState } from 'react';
import { Link } from 'react-router-dom';
import PlayerManagement from '../components/PlayerManagement';
import GiftCodeManagement from '../components/GiftCodeManagement';
import TestTool from '../components/TestTool';

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState<'players' | 'codes' | 'test'>('players');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                🛠️ 管理后台
              </h1>
              <p className="text-gray-300">
                玩家管理 · 礼包码管理 · 测试工具
              </p>
            </div>
            <Link
              to="/"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              ← 返回用户页面
            </Link>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('players')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'players'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            👥 玩家管理
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'codes'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            🎁 礼包码管理
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'test'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            🧪 测试工具
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'players' && <PlayerManagement isAdminMode={true} />}
          {activeTab === 'codes' && <GiftCodeManagement isAdminMode={true} />}
          {activeTab === 'test' && <TestTool />}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>管理后台 · 仅限授权用户访问</p>
        </footer>
      </div>
    </div>
  );
}
