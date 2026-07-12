import React, { useState } from 'react';
import { Measurements } from '../types';

interface ManualMeasurementsProps {
  onMeasurements: (measurements: Measurements) => void;
  initialMeasurements?: Measurements;
  onBack?: () => void;
}

const ManualMeasurements: React.FC<ManualMeasurementsProps> = ({
  onMeasurements,
  initialMeasurements = {},
  onBack
}) => {
  const [measurements, setMeasurements] = useState<Measurements>(initialMeasurements);

  const measurementFields = [
    { key: 'height', label: 'Height (cm)', placeholder: '175' },
    { key: 'chest', label: 'Chest (cm)', placeholder: '95' },
    { key: 'waist', label: 'Waist (cm)', placeholder: '85' },
    { key: 'hips', label: 'Hips (cm)', placeholder: '100' },
    { key: 'shoulder_width', label: 'Shoulder Width (cm)', placeholder: '45' },
    { key: 'arm_length', label: 'Arm Length (cm)', placeholder: '60' },
    { key: 'inseam', label: 'Inseam (cm)', placeholder: '80' },
  ];

  const handleChange = (key: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setMeasurements(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMeasurements(measurements);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Manual Measurements
        </h3>
        <p className="text-sm text-gray-600">
          Enter your body measurements manually
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {measurementFields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={measurements[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Scan Options
            </button>
          )}
          <button
            type="submit"
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Save Measurements
          </button>
        </div>
      </form>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Measurement Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use a flexible measuring tape</li>
          <li>• Measure over light clothing or bare skin</li>
          <li>• Keep the tape snug but not tight</li>
          <li>• Have someone help you for accurate measurements</li>
        </ul>
      </div>
    </div>
  );
};

export default ManualMeasurements;
