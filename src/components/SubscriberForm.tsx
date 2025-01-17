import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface SubscriberFormData {
  email: string;
  first_name: string;
  last_name: string;
  demographics: {
    age_group?: string;
    gender?: string;
    occupation?: string;
    interests?: string[];
  };
  location: {
    country: string;
    city?: string;
    timezone: string;
  };
}

export function SubscriberForm({ onSubmit, initialData }: {
  onSubmit: (data: SubscriberFormData) => void;
  initialData?: Partial<SubscriberFormData>;
}) {
  const [formData, setFormData] = useState<SubscriberFormData>({
    email: initialData?.email || '',
    first_name: initialData?.first_name || '',
    last_name: '',
    demographics: initialData?.demographics || {},
    location: initialData?.location || {
      country: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });

  const [interests, setInterests] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      demographics: {
        ...formData.demographics,
        interests
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Age Group
          </label>
          <select
            value={formData.demographics.age_group}
            onChange={e => setFormData({
              ...formData,
              demographics: { ...formData.demographics, age_group: e.target.value }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select age group</option>
            <option value="18-24">18-24</option>
            <option value="25-34">25-34</option>
            <option value="35-44">35-44</option>
            <option value="45-54">45-54</option>
            <option value="55+">55+</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            type="text"
            value={formData.location.country}
            onChange={e => setFormData({
              ...formData,
              location: { ...formData.location, country: e.target.value }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Interests
          </label>
          <div className="mt-2 space-y-2">
            {['Technology', 'Business', 'Marketing', 'Design', 'Development'].map(interest => (
              <label key={interest} className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={interests.includes(interest)}
                  onChange={e => {
                    if (e.target.checked) {
                      setInterests([...interests, interest]);
                    } else {
                      setInterests(interests.filter(i => i !== interest));
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-600">{interest}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save
        </button>
      </div>
    </form>
  );
} 