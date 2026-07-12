import React from 'react';

interface CalibrationGuideProps {
  onStartCalibration: () => void;
  onSkipCalibration: () => void;
}

const CalibrationGuide: React.FC<CalibrationGuideProps> = ({ 
  onStartCalibration, 
  onSkipCalibration 
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Calibration Setup
        </h3>
        <p className="text-sm text-gray-600">
          For accurate measurements, we need to calibrate the camera with a reference object
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Calibration Instructions:</h4>
        <ol className="text-sm text-blue-700 space-y-2">
          <li>1. Hold a credit card (8.5cm x 5.4cm) or ruler at arm's length</li>
          <li>2. Position it horizontally in front of your chest</li>
          <li>3. Make sure it's clearly visible in the camera</li>
          <li>4. Stand 1-2 meters away from the camera</li>
          <li>5. Ensure good lighting and plain background</li>
        </ol>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Tips for Best Results:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Use a standard credit card or ruler for reference</li>
          <li>• Stand in good lighting (avoid shadows)</li>
          <li>• Keep the reference object flat and straight</li>
          <li>• Position yourself 1-2 meters from the camera</li>
          <li>• Wear form-fitting clothing for better detection</li>
        </ul>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onStartCalibration}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Calibration
        </button>
        <button
          onClick={onSkipCalibration}
          className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Skip Calibration
        </button>
      </div>
    </div>
  );
};

export default CalibrationGuide;
