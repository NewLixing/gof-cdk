import { useEffect } from 'react';
import { getTaskStatus } from '../lib/api';
import type { PlayerTask, TaskStatus } from '../types';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: PlayerTask[];
  onTaskUpdate: (tasks: PlayerTask[]) => void;
}

export default function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  // Poll task status every 2 seconds
  useEffect(() => {
    if (tasks.length === 0) return;

    const interval = setInterval(async () => {
      const updatedTasks = await Promise.all(
        tasks.map(async (task) => {
          // Skip if already completed or failed
          if (task.status?.status === 'completed' || task.status?.status === 'failed') {
            return task;
          }

          const result = await getTaskStatus(task.taskId);
          
          if (result.success && result.data) {
            return {
              ...task,
              status: result.data,
            };
          }
          
          return task;
        })
      );

      onTaskUpdate(updatedTasks);
    }, 2000);

    return () => clearInterval(interval);
  }, [tasks, onTaskUpdate]);

  if (tasks.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-gray-400">
          <svg
            className="w-24 h-24 mx-auto mb-4 opacity-20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-lg">暂无任务</p>
          <p className="text-sm mt-2">提交任务后将在此处显示实时进度</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-purple-400">📊</span>
          任务进度
          <span className="text-sm font-normal text-gray-400 ml-auto">
            共 {tasks.length} 个任务
          </span>
        </h2>
      </div>

      <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
        {tasks.map((task) => (
          <TaskCard key={task.taskId} task={task} />
        ))}
      </div>
    </div>
  );
}
