import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { InternshipCard } from '../components/internships/InternshipCard';

interface Internship {
  id: string;
  title: string;
  slug: string;
  description: string;
  skills_required: string[];
  duration_weeks: number;
  stipend: number | null;
  location: string;
  start_date: string;
  application_deadline: string;
  created_at: string;
  profiles: {
    full_name: string;
    company_name?: string;
    avatar_url?: string;
  };
}

export function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const availableSkills = [
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'Django',
    'PostgreSQL',
    'MongoDB',
    'AWS',
    'Docker',
    'Git',
    'HTML/CSS',
    'TypeScript',
    'Vue.js',
    'Angular',
    'Express.js',
    'GraphQL',
    'REST API',
    'UI/UX Design',
    'Figma',
    'Photoshop',
  ];

  useEffect(() => {
    loadInternships();
  }, []);

  const loadInternships = async () => {
    try {
      const { data, error } = await supabase
        .from('internships')
        .select(`
          *,
          profiles!employer_id (
            full_name,
            company_name,
            avatar_url
          )
        `)
        .eq('status', 'published')
        .gte('application_deadline', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInternships(data || []);
    } catch (error) {
      console.error('Error loading internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInternships = internships.filter((internship) => {
    const matchesSearch = searchTerm === '' || 
      internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.profiles.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.skills_required.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.some(skill => internship.skills_required.includes(skill));

    return matchesSearch && matchesSkills;
  });

  const toggleSkillFilter = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Remote Internships
          </h1>
          <p className="text-gray-600">
            Discover amazing remote internship opportunities from top companies.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search internships, companies, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
              {selectedSkills.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {selectedSkills.length}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filter by Skills</h3>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkillFilter(skill)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {selectedSkills.length > 0 && (
                <button
                  onClick={() => setSelectedSkills([])}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            {filteredInternships.length} internship{filteredInternships.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Internships Grid */}
        {filteredInternships.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInternships.map((internship) => (
              <InternshipCard
                key={internship.id}
                internship={{
                  ...internship,
                  employer: {
                    full_name: internship.profiles.full_name,
                    company_name: internship.profiles.company_name,
                    avatar_url: internship.profiles.avatar_url,
                  },
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No internships found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or filters to find more internships.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}