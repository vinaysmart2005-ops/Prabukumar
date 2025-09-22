import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalInternships: number;
  activeInterns: number;
  pendingApplications: number;
  completedTasks: number;
}

interface RecentInternship {
  id: string;
  title: string;
  status: string;
  applications_count: number;
  created_at: string;
}

export function EmployerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInternships: 0,
    activeInterns: 0,
    pendingApplications: 0,
    completedTasks: 0,
  });
  const [recentInternships, setRecentInternships] = useState<RecentInternship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile) return;

    try {
      // Load stats
      const [internshipsData, membershipData, applicationsData, tasksData] = await Promise.all([
        supabase
          .from('internships')
          .select('id, status')
          .eq('employer_id', profile.id),
        supabase
          .from('internship_memberships')
          .select('id')
          .eq('internship_id', profile.id)
          .eq('status', 'active'),
        supabase
          .from('applications')
          .select('id')
          .eq('status', 'pending'),
        supabase
          .from('tasks')
          .select('id')
          .eq('created_by', profile.id)
          .eq('status', 'done'),
      ]);

      setStats({
        totalInternships: internshipsData.data?.length || 0,
        activeInterns: membershipData.data?.length || 0,
        pendingApplications: applicationsData.data?.length || 0,
        completedTasks: tasksData.data?.length || 0,
      });

      // Load recent internships with application counts
      const { data: internships } = await supabase
        .from('internships')
        .select(`
          id,
          title,
          status,
          created_at,
          applications(count)
        `)
        .eq('employer_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (internships) {
        const formattedInternships = internships.map(internship => ({
          id: internship.id,
          title: internship.title,
          status: internship.status,
          applications_count: (internship.applications as any)?.[0]?.count || 0,
          created_at: internship.created_at,
        }));
        setRecentInternships(formattedInternships);
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
      name: 'Total Internships',
      value: stats.totalInternships,
      icon: BriefcaseIcon,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      name: 'Active Interns',
      value: stats.activeInterns,
      icon: UserGroupIcon,
      color: 'text-green-600 bg-green-100',
    },
    {
      name: 'Pending Applications',
      value: stats.pendingApplications,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name}
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your internships and track intern progress from your dashboard.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/employer/internships/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Post New Internship
              </Link>
              <Link
                to="/employer/applications"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Review Applications
              </Link>
              <Link
                to="/employer/tasks"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Manage Tasks
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

        {/* Recent Internships */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Internships</h2>
              <Link
                to="/employer/internships"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentInternships.length > 0 ? (
              recentInternships.map((internship) => (
                <div key={internship.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {internship.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {internship.applications_count} applications •{' '}
                        <span className="capitalize">{internship.status}</span>
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(internship.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No internships yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by posting your first internship.
                </p>
                <div className="mt-6">
                  <Link
                    to="/employer/internships/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Post Internship
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