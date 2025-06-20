import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { Task } from '../model/task';

export const taskQueries = {
  // Get all tasks for today (tasks that are due today or overdue)
  getTodaysTasks: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return database.collections.get<Task>('tasks').query(
      Q.where('status', Q.oneOf(['todo', 'in_progress'])),
      Q.or(
        Q.where('due_date', Q.lte(tomorrow.getTime())),
        Q.where('due_date', Q.gte(today.getTime()))
      ),
      Q.sortBy('priority', Q.desc),
      Q.sortBy('due_date', Q.asc),
      Q.sortBy('position', Q.asc)
    );
  },

  // Get tasks by status
  getTasksByStatus: (status: 'todo' | 'in_progress' | 'completed' | 'cancelled') => {
    return database.collections.get<Task>('tasks').query(
      Q.where('status', status),
      Q.sortBy('updated_at', Q.desc)
    );
  },

  // Get active tasks (todo + in_progress)
  getActiveTasks: () => {
    return database.collections.get<Task>('tasks').query(
      Q.where('status', Q.oneOf(['todo', 'in_progress'])),
      Q.sortBy('priority', Q.desc),
      Q.sortBy('due_date', Q.asc),
      Q.sortBy('position', Q.asc)
    );
  },

  // Get completed tasks
  getCompletedTasks: () => {
    return database.collections.get<Task>('tasks').query(
      Q.where('status', 'completed'),
      Q.sortBy('completed_at', Q.desc)
    );
  },

  // Get overdue tasks
  getOverdueTasks: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return database.collections.get<Task>('tasks').query(
      Q.where('status', Q.oneOf(['todo', 'in_progress'])),
      Q.where('due_date', Q.lt(today.getTime())),
      Q.sortBy('due_date', Q.asc)
    );
  },

  // Get upcoming tasks (due in the next 7 days)
  getUpcomingTasks: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return database.collections.get<Task>('tasks').query(
      Q.where('status', Q.oneOf(['todo', 'in_progress'])),
      Q.where('due_date', Q.between(today.getTime(), nextWeek.getTime())),
      Q.sortBy('due_date', Q.asc)
    );
  },

  // Get task by ID
  getTaskById: (id: string) => {
    return database.collections.get<Task>('tasks').find(id);
  },

  // Get tasks by project
  getTasksByProject: (projectId: string) => {
    return database.collections.get<Task>('tasks').query(
      Q.where('project_id', projectId),
      Q.sortBy('position', Q.asc)
    );
  },

  // Get tasks assigned to user
  getTasksByAssignee: (assigneeId: string) => {
    return database.collections.get<Task>('tasks').query(
      Q.where('assignee_id', assigneeId),
      Q.where('status', Q.oneOf(['todo', 'in_progress'])),
      Q.sortBy('due_date', Q.asc)
    );
  },

  // Search tasks by title or description
  searchTasks: (searchTerm: string) => {
    return database.collections.get<Task>('tasks').query(
      Q.or(
        Q.where('title', Q.like(`%${Q.sanitizeLikeString(searchTerm)}%`)),
        Q.where('description', Q.like(`%${Q.sanitizeLikeString(searchTerm)}%`))
      ),
      Q.sortBy('updated_at', Q.desc)
    );
  },

  // Get tasks by priority
  getTasksByPriority: (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    return database.collections.get<Task>('tasks').query(
      Q.where('priority', priority),
      Q.where('status', Q.oneOf(['todo', 'in_progress'])),
      Q.sortBy('due_date', Q.asc)
    );
  },

  // Get recently updated tasks
  getRecentlyUpdatedTasks: (limit: number = 10) => {
    return database.collections.get<Task>('tasks').query(
      Q.sortBy('updated_at', Q.desc),
      Q.take(limit)
    );
  },

  // Get tasks with no due date
  getTasksWithoutDueDate: () => {
    return database.collections.get<Task>('tasks').query(
      Q.where('due_date', null),
      Q.where('status', Q.oneOf(['todo', 'in_progress'])),
      Q.sortBy('priority', Q.desc),
      Q.sortBy('created_at', Q.desc)
    );
  },
};