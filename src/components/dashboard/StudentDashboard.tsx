import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  totalApplications: number;
  activeInternships: number;
  pendingTasks: number;
  completedTasks: number;
}

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  internship: {
    title: string;
  };
}

export function StudentDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeInternships: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile) return;

    try {
      // Load stats
      const [applicationsData, membershipData, pendingTasksData, completedTasksData] = await Promise.all([
        supabase
          .from('applications')
          .select('id')
          .eq('student_id', profile.id),
        supabase
          .from('internship_memberships')
          .select('id')
          .eq('student_id', profile.id)
          .eq('status', 'active'),
        supabase
          .from('tasks')
          .select('id')
          .eq('assigned_to', profile.id)
          .in('status', ['todo', 'in_progress', 'review']),
        supabase
          .from('tasks')
          .select('id')
          .eq('assigned_to', profile.id)
          .eq('status', 'done'),
      ]);

      setStats({
        totalApplications: applicationsData.data?.length || 0,
        activeInternships: membershipData.data?.length || 0,
        pendingTasks: pendingTasksData.data?.length || 0,
        completedTasks: completedTasksData.data?.length || 0,
      });

      // Load upcoming tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          due_date,
          status,
          priority,
          internships!internship_id (title)
        `)
        .eq('assigned_to', profile.id)
        .in('status', ['todo', 'in_progress', 'review'])
        .order('due_date', { ascending: true, nullsLast: true })
        .limit(5);

      if (tasks) {
        setUpcomingTasks(tasks.map(task => ({
          ...task,
          internship: { title: (task.internships as any)?.title || 'Unknown' }
        })));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Applications Submitted',
      value: stats.totalApplications,
      icon: BriefcaseIcon,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      name: 'Active Internships',
      value: stats.activeInternships,
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100',
    },
    {
      name: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: ClockIcon,
      color: 'text-yellow-600 bg-yellow-100',
    },
    {
      name: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: 'text-indigo-600 bg-indigo-100',
    },
  ];

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name}
          </h1>
          <p className="mt-2 text-gray-600">
            Track your internship progress and manage your tasks.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/internships"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <BriefcaseIcon className="h-5 w-5 mr-2" />
                Browse Internships
              </Link>
              <Link
                to="/student/tasks"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                View My Tasks
              </Link>
              <Link
                to="/student/reports"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Submit Report
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
              <Link
                to="/student/tasks"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div key={task.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {task.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {task.internship.title}
                      </p>
                      {task.due_date && (
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Due {formatDistanceToNow(new Date(task.due_date))} from now
                        </div>
                      )}
                    </div>
                    {task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' && (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tasks will appear here once you join an internship.
                </p>
                <div className="mt-6">
                  <Link
                    to="/internships"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Browse Internships
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}