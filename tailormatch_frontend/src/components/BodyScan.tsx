import React, { useRef, useState, useEffect } from 'react';
import { Measurements } from '../types';
import { 
  MediaPipePoseDetector, 
  CalibrationData, 
  ScanPose, 
  ScanResult,
  validateMeasurements,
  calculateMeasurementConfidence,
  suggestCorrections
} from '../utils/mediapipe';

interface BodyScanProps {
  onMeasurements: (measurements: Measurements) => void;
  onManualInput: () => void;
}

const BodyScan: React.FC<BodyScanProps> = ({ onMeasurements, onManualInput }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<MediaPipePoseDetector | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurements>({});
  const [poseDetected, setPoseDetected] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'calibration' | 'scanning' | 'complete'>('calibration');
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [scanPoses, setScanPoses] = useState<ScanPose[]>([]);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Helper function to safely play video
  const safePlayVideo = async (video: HTMLVideoElement): Promise<void> => {
    try {
      // If there's already a play promise in progress, wait for it to complete
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }
      
      // Reset the video if it's in an error state
      if (video.error) {
        video.load();
      }
      
      // Create a new play promise
      playPromiseRef.current = video.play();
      await playPromiseRef.current;
      playPromiseRef.current = null;
    } catch (error) {
      playPromiseRef.current = null;
      console.warn('Video play failed:', error);
      // Don't throw the error, just log it and continue
    }
  };

  useEffect(() => {
    // Initialize detector
    detectorRef.current = new MediaPipePoseDetector();
    
    return () => {
      // Cleanup camera stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectorRef.current) {
        detectorRef.current.stopDetection();
      }
      // Clear any pending play promise
      playPromiseRef.current = null;
    };
  }, []);

  // Initialize scan poses
  useEffect(() => {
    if (detectorRef.current) {
      setScanPoses(detectorRef.current.getScanPoses());
    }
  }, []);

  const startCalibration = async () => {
    try {
      setError(null);
      setIsScanning(true);
      setCurrentStep('calibration');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        // Stop any existing stream first
        if (videoRef.current.srcObject) {
          const existingStream = videoRef.current.srcObject as MediaStream;
          existingStream.getTracks().forEach(track => track.stop());
        }
        
        videoRef.current.srcObject = stream;
        
        // Wait for the video to be ready before playing
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            const handleLoadedMetadata = () => {
              videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
              resolve();
            };
            videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
            
            // If metadata is already loaded, resolve immediately
            if (videoRef.current.readyState >= 1) {
              resolve();
            }
          }
        });
        
        // Use the safe play method
        await safePlayVideo(videoRef.current);
      }

      // Start pose detection for calibration
      if (detectorRef.current && videoRef.current) {
        await detectorRef.current.startDetection(videoRef.current, (landmarks) => {
          if (landmarks && landmarks.length >= 33) {
            setPoseDetected(true);
            // Auto-calibrate with shoulder width as reference
            const shoulderWidth = Math.sqrt(
              Math.pow(landmarks[12].x - landmarks[11].x, 2) + 
              Math.pow(landmarks[12].y - landmarks[11].y, 2)
            );
            // Assume average shoulder width is 40cm
            const pixelToCmRatio = 40 / (shoulderWidth * 1280);
            
            const calibration = detectorRef.current!.calibrateWithReference(
              { width: 40, height: 30 }, // Reference shoulder width
              shoulderWidth * 1280,
              shoulderWidth * 1280 * 0.75,
              150
            );
            
            setCalibrationData(calibration);
            setCurrentStep('scanning');
            setScanProgress(0);
          }
        });
      }

    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Camera access denied. Please allow camera access or use manual input.');
      setIsScanning(false);
    }
  };

  const capturePose = async () => {
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get current pose landmarks
    const landmarks = await new Promise<any[]>((resolve) => {
      detectorRef.current!.startDetection(video, (landmarks) => {
        resolve(landmarks);
      });
    });

    if (landmarks && landmarks.length >= 33) {
      // Draw pose landmarks on canvas
      detectorRef.current!.drawPoseLandmarks(canvas, landmarks, video.videoWidth, video.videoHeight);
      
      // Calculate measurements
      const measurements = detectorRef.current!.calculateMeasurements(landmarks);
      const confidence = calculateMeasurementConfidence(measurements);
      const suggestions = suggestCorrections(measurements);
      
      // Create scan result
      const scanResult: ScanResult = {
        measurements,
        confidence,
        pose: scanPoses[currentPoseIndex]?.name || 'unknown',
        timestamp: Date.now()
      };
      
      // Add to results
      detectorRef.current!.addScanResult(scanResult);
      setScanResults(prev => [...prev, scanResult]);
      setConfidence(confidence);
      setSuggestions(suggestions);
      
      // Move to next pose or complete
      if (currentPoseIndex < scanPoses.length - 1) {
        setCurrentPoseIndex(prev => prev + 1);
        setScanProgress((currentPoseIndex + 1) / scanPoses.length * 100);
      } else {
        // All poses captured, get averaged measurements
        const averagedMeasurements = detectorRef.current!.getAveragedMeasurements();
        if (averagedMeasurements) {
          setMeasurements(averagedMeasurements);
          setCurrentStep('complete');
      setScanProgress(100);
      
      setTimeout(() => {
            onMeasurements(averagedMeasurements);
        setIsScanning(false);
          }, 2000);
        }
      }
    }
  };

  const startScanning = async () => {
    await startCalibration();
  };

  const stopScanning = () => {
    // Stop any pending play promise
    if (playPromiseRef.current) {
      playPromiseRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (detectorRef.current) {
      detectorRef.current.stopDetection();
    }
    setIsScanning(false);
    setCurrentStep('calibration');
    setCurrentPoseIndex(0);
    setScanResults([]);
    setConfidence(0);
    setSuggestions([]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Enhanced AI Body Measurement Scan
        </h3>
        <p className="text-sm text-gray-600">
          {currentStep === 'calibration' && 'Position yourself in front of the camera for calibration'}
          {currentStep === 'scanning' && `Pose ${currentPoseIndex + 1} of ${scanPoses.length}: ${scanPoses[currentPoseIndex]?.description}`}
          {currentStep === 'complete' && 'Scan complete! Review your measurements below.'}
        </p>
      </div>

      <div className="relative">
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          
          {/* Enhanced scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="w-48 bg-gray-300 rounded-full h-2 mb-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm">{Math.round(scanProgress)}% Complete</p>
                </div>
                
                {currentStep === 'calibration' && (
                  <>
                    <p className="text-lg font-semibold mb-2">Calibrating Camera...</p>
                    <p className="text-sm">Please stand straight and face the camera</p>
                    {poseDetected && (
                      <p className="text-sm text-green-300 mt-2">✓ Calibration complete! Starting scan...</p>
                    )}
                  </>
                )}
                
                {currentStep === 'scanning' && (
                  <>
                    <p className="text-lg font-semibold mb-2">Capturing Pose {currentPoseIndex + 1}...</p>
                    <p className="text-sm">{scanPoses[currentPoseIndex]?.description}</p>
                {poseDetected && (
                      <p className="text-sm text-green-300 mt-2">✓ Pose captured! Moving to next pose...</p>
                    )}
                  </>
                )}
                
                {currentStep === 'complete' && (
                  <>
                    <p className="text-lg font-semibold mb-2 text-green-300">✓ Scan Complete!</p>
                    <p className="text-sm">Processing measurements...</p>
                    <p className="text-sm text-green-300 mt-2">Confidence: {confidence}%</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Camera Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {Object.keys(measurements).length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-green-800">Final Measurements:</h4>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
              Confidence: {confidence}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(measurements).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-green-700 capitalize">{key.replace('_', ' ')}:</span>
                <span className="text-green-900 font-medium">{value} cm</span>
              </div>
            ))}
          </div>
          
          {suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <h5 className="text-xs font-medium text-green-800 mb-1">Suggestions:</h5>
              <ul className="text-xs text-green-700 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {scanResults.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Scan Results:</h4>
          <div className="space-y-2">
            {scanResults.map((result, index) => (
              <div key={index} className="text-xs text-blue-700">
                <span className="font-medium">Pose {index + 1}:</span> {result.pose} 
                <span className="ml-2 text-blue-600">({result.confidence}% confidence)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Enhanced Body Scan
          </button>
        ) : (
          <>
            {currentStep === 'scanning' && (
              <button
                onClick={capturePose}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Capture Current Pose
              </button>
            )}
          <button
            onClick={stopScanning}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop Scan
          </button>
          </>
        )}
        
        <button
          onClick={onManualInput}
          className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Manual Input
        </button>
      </div>
    </div>
  );
};

export default BodyScan;
