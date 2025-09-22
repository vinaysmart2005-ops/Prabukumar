import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface InternshipCardProps {
  internship: {
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
    employer: {
      full_name: string;
      company_name?: string;
      avatar_url?: string;
    };
  };
}

export function InternshipCard({ internship }: InternshipCardProps) {
  const isDeadlineSoon = new Date(internship.application_deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              {internship.employer.avatar_url ? (
                <img
                  src={internship.employer.avatar_url}
                  alt={internship.employer.company_name || internship.employer.full_name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {internship.title}
              </h3>
              <p className="text-sm text-gray-600">
                {internship.employer.company_name || internship.employer.full_name}
              </p>
            </div>
          </div>
          {isDeadlineSoon && (
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Deadline Soon
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {internship.description}
        </p>

        {/* Skills */}
        {internship.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {internship.skills_required.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-md"
              >
                {skill}
              </span>
            ))}
            {internship.skills_required.length > 3 && (
              <span className="text-xs text-gray-500">
                +{internship.skills_required.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="h-4 w-4" />
            <span>{internship.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4" />
            <span>{internship.duration_weeks} weeks</span>
          </div>
          {internship.stipend && (
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="h-4 w-4" />
              <span>${internship.stipend.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <span>
              Deadline: {new Date(internship.application_deadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Posted {formatDistanceToNow(new Date(internship.created_at))} ago
          </span>
          <Link
            to={`/internships/${internship.slug}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}