import { useState } from 'react';
import { getSegmentedSubscribers, SegmentCriteria } from '../lib/segmentation';
import { ChevronDown } from 'lucide-react';

interface SegmentationBuilderProps {
  onSegmentChange: (subscribers: any[]) => void;
}

export function SegmentationBuilder({ onSegmentChange }: SegmentationBuilderProps) {
  const [activeSegment, setActiveSegment] = useState<string>('demographic');
  const [isOpen, setIsOpen] = useState(false);
  const [criteria, setCriteria] = useState<SegmentCriteria>({});
  const [loading, setLoading] = useState(false);

  const segments = [
    { id: 'demographic', label: 'Demographics' },
    { id: 'geographic', label: 'Geographic' },
    { id: 'psychographic', label: 'Psychographic' },
    { id: 'behavioral', label: 'Behavioral' },
    { id: 'lifecycle', label: 'Lifecycle Stage' },
    { id: 'purchase_history', label: 'Purchase History' },
    { id: 'email_engagement', label: 'Email Engagement' }
  ];

  const handleCriteriaChange = async (
    category: string,
    subCategory: string,
    value: any,
    checked: boolean
  ) => {
    const updatedCriteria = { ...criteria };
    if (!updatedCriteria[category]) {
      updatedCriteria[category] = {};
    }

    if (Array.isArray(updatedCriteria[category][subCategory])) {
      if (checked) {
        updatedCriteria[category][subCategory].push(value);
      } else {
        updatedCriteria[category][subCategory] = updatedCriteria[category][subCategory]
          .filter(item => item !== value);
      }
    } else {
      updatedCriteria[category][subCategory] = value;
    }

    setCriteria(updatedCriteria);
    await applySegmentation(updatedCriteria);
  };

  const applySegmentation = async (segmentCriteria: SegmentCriteria) => {
    setLoading(true);
    try {
      const subscribers = await getSegmentedSubscribers(segmentCriteria);
      onSegmentChange(subscribers);
    } catch (error) {
      console.error('Error applying segmentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeSegmentLabel = segments.find(s => s.id === activeSegment)?.label;

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Dropdown */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <button
            type="button"
            className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="font-medium text-gray-900">{activeSegmentLabel}</span>
            <ChevronDown 
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 border border-gray-200">
              {segments.map(segment => (
                <button
                  key={segment.id}
                  className={`
                    w-full px-4 py-2 text-sm text-left hover:bg-gray-100
                    ${activeSegment === segment.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}
                  `}
                  onClick={() => {
                    setActiveSegment(segment.id);
                    setIsOpen(false);
                  }}
                >
                  {segment.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="p-6">
        {loading && (
          <div className="text-sm text-gray-500">
            Updating segment...
          </div>
        )}
        
        {/* Placeholder for segmentation criteria UI */}
        <div className="text-sm text-gray-500">
          Select {activeSegmentLabel?.toLowerCase()} criteria
        </div>
      </div>
    </div>
  );
} 