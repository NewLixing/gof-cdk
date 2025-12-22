import PlayerManagement from './components/PlayerManagement';
import GiftCodeManagement from './components/GiftCodeManagement';
import AutoRedeemControl from './components/AutoRedeemControl';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            无尽冬日 礼包码自动领取系统
          </h1>
          <p className="text-gray-300 text-lg">
            订阅玩家 · 管理礼包码 · 自动领取
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              自动化
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              订阅制
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              AI 驱动
            </span>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Player Management */}
          <div className="lg:col-span-1">
            <PlayerManagement />
          </div>

          {/* Middle: Gift Code Management */}
          <div className="lg:col-span-1">
            <GiftCodeManagement />
          </div>

          {/* Right: Auto Redeem Control */}
          <div className="lg:col-span-1">
            <AutoRedeemControl />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 card p-6">
          <h3 className="text-xl font-bold text-white mb-4">📖 使用说明</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">1️⃣ 订阅玩家</h4>
              <p>在左侧输入玩家ID进行订阅，系统会自动保存玩家信息。</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">2️⃣ 管理礼包码</h4>
              <p>在中间添加礼包码到系统，有效礼包码会自动用于领取。</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">3️⃣ 自动领取</h4>
              <p>点击右侧按钮，系统将为所有订阅玩家自动领取所有礼包码。</p>
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

export default App;
