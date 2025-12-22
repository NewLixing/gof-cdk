import { useState } from 'react';
import BatchForm from './components/BatchForm';
import TaskList from './components/TaskList';
import type { PlayerTask } from './types';

function App() {
  const [tasks, setTasks] = useState<PlayerTask[]>([]);

  const handleTasksCreated = (newTasks: PlayerTask[]) => {
    setTasks(prev => [...newTasks, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            无尽冬日 礼包码批量领取平台
          </h1>
          <p className="text-gray-300 text-lg">
            基于 Cloudflare Pages + Workers + AI 的现代化礼包码处理系统
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              零运维
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              全球加速
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              AI 驱动
            </span>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div>
            <BatchForm onTasksCreated={handleTasksCreated} />
          </div>

          {/* Right: Task List */}
          <div>
            <TaskList tasks={tasks} onTaskUpdate={setTasks} />
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
