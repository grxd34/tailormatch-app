// Enhanced MediaPipe integration utilities for accurate body scanning

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface BodyMeasurements {
  height: number;
  chest: number;
  waist: number;
  hips: number;
  shoulder_width: number;
  arm_length: number;
  inseam: number;
  neck?: number;
  bicep?: number;
  thigh?: number;
}

export interface CalibrationData {
  pixelToCmRatio: number;
  referenceObject: {
    width: number;
    height: number;
    detectedWidth: number;
    detectedHeight: number;
  };
  cameraDistance: number;
}

export interface ScanPose {
  name: string;
  description: string;
  landmarks: number[];
  required: boolean;
}

export interface ScanResult {
  measurements: BodyMeasurements;
  confidence: number;
  pose: string;
  timestamp: number;
}

export class MediaPipePoseDetector {
  private pose: any = null;
  private camera: any = null;
  private isInitialized = false;
  private calibrationData: CalibrationData | null = null;
  private scanResults: ScanResult[] = [];
  private currentPose: string = '';

  // Define scan poses for different measurements
  private scanPoses: ScanPose[] = [
    {
      name: 'front_standard',
      description: 'Stand straight, arms at sides',
      landmarks: [0, 11, 12, 23, 24, 15, 16, 27, 28],
      required: true
    },
    {
      name: 'arms_outstretched',
      description: 'Arms extended horizontally',
      landmarks: [11, 12, 13, 14, 15, 16],
      required: true
    },
    {
      name: 'side_profile',
      description: 'Turn to the side',
      landmarks: [0, 11, 12, 23, 24, 25, 26, 27, 28],
      required: false
    }
  ];

  async initialize(videoElement: HTMLVideoElement) {
    if (this.isInitialized) return;

    try {
      // Import MediaPipe pose detection
      const { Pose } = await import('@mediapipe/pose');
      const { Camera } = await import('@mediapipe/camera_utils');
      
      this.pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      this.pose.setOptions({
        modelComplexity: 2, // Higher complexity for better accuracy
        smoothLandmarks: true,
        enableSegmentation: true, // Enable for better body detection
        smoothSegmentation: true,
        minDetectionConfidence: 0.7, // Higher confidence threshold
        minTrackingConfidence: 0.7
      });

      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          await this.pose.send({ image: videoElement });
        },
        width: 1280, // Higher resolution for better accuracy
        height: 720
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      throw error;
    }
  }

  async startDetection(videoElement: HTMLVideoElement, onResults: (landmarks: PoseLandmark[]) => void) {
    if (!this.pose) {
      await this.initialize(videoElement);
    }

    this.pose.onResults((results: any) => {
      if (results.poseLandmarks) {
        onResults(results.poseLandmarks);
      }
    });

    await this.camera.start();
  }

  stopDetection() {
    if (this.camera) {
      this.camera.stop();
    }
  }

  // Calibration system for accurate measurements
  calibrateWithReference(referenceObject: { width: number; height: number }, detectedWidth: number, detectedHeight: number, cameraDistance: number = 150): CalibrationData {
    const pixelToCmRatio = referenceObject.width / detectedWidth;
    
    this.calibrationData = {
      pixelToCmRatio,
      referenceObject: {
        width: referenceObject.width,
        height: referenceObject.height,
        detectedWidth,
        detectedHeight
      },
      cameraDistance
    };

    return this.calibrationData;
  }

  // Get current calibration data
  getCalibrationData(): CalibrationData | null {
    return this.calibrationData;
  }

  // Set current pose for scanning
  setCurrentPose(poseName: string) {
    this.currentPose = poseName;
  }

  // Get available scan poses
  getScanPoses(): ScanPose[] {
    return this.scanPoses;
  }

  // Add scan result for averaging
  addScanResult(result: ScanResult) {
    this.scanResults.push(result);
  }

  // Get averaged measurements from multiple scans
  getAveragedMeasurements(): BodyMeasurements | null {
    if (this.scanResults.length === 0) return null;

    const measurements: Partial<BodyMeasurements> = {};
    const measurementKeys = ['height', 'chest', 'waist', 'hips', 'shoulder_width', 'arm_length', 'inseam', 'neck', 'bicep', 'thigh'];

    measurementKeys.forEach(key => {
      const values = this.scanResults
        .map(result => result.measurements[key as keyof BodyMeasurements])
        .filter(value => value !== undefined) as number[];
      
      if (values.length > 0) {
        measurements[key as keyof BodyMeasurements] = Math.round(
          values.reduce((sum, val) => sum + val, 0) / values.length
        );
      }
    });

    return measurements as BodyMeasurements;
  }

  // Clear scan results
  clearScanResults() {
    this.scanResults = [];
  }

  calculateMeasurements(landmarks: PoseLandmark[]): BodyMeasurements {
    if (!landmarks || landmarks.length < 33) {
      throw new Error('Insufficient pose landmarks detected');
    }

    // Enhanced landmark indices for more accurate measurements
    const LANDMARKS = {
      NOSE: 0,
      LEFT_EAR: 7,
      RIGHT_EAR: 8,
      LEFT_SHOULDER: 11,
      RIGHT_SHOULDER: 12,
      LEFT_ELBOW: 13,
      RIGHT_ELBOW: 14,
      LEFT_WRIST: 15,
      RIGHT_WRIST: 16,
      LEFT_PINKY: 17,
      RIGHT_PINKY: 18,
      LEFT_INDEX: 19,
      RIGHT_INDEX: 20,
      LEFT_THUMB: 21,
      RIGHT_THUMB: 22,
      LEFT_HIP: 23,
      RIGHT_HIP: 24,
      LEFT_KNEE: 25,
      RIGHT_KNEE: 26,
      LEFT_ANKLE: 27,
      RIGHT_ANKLE: 28,
      LEFT_HEEL: 29,
      RIGHT_HEEL: 30,
      LEFT_FOOT_INDEX: 31,
      RIGHT_FOOT_INDEX: 32,
    };

    const getDistance = (p1: PoseLandmark, p2: PoseLandmark) => {
      return Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + 
        Math.pow(p2.y - p1.y, 2) + 
        Math.pow(p2.z - p1.z, 2)
      );
    };

    const getCircumference = (width: number, depth: number = 0) => {
      // Estimate circumference from width and depth
      if (depth === 0) depth = width * 0.8; // Assume elliptical shape
      return Math.PI * Math.sqrt((width * width + depth * depth) / 2);
    };

    // Calculate basic measurements with enhanced accuracy
    const shoulderWidth = getDistance(
      landmarks[LANDMARKS.LEFT_SHOULDER], 
      landmarks[LANDMARKS.RIGHT_SHOULDER]
    );
    
    const hipWidth = getDistance(
      landmarks[LANDMARKS.LEFT_HIP], 
      landmarks[LANDMARKS.RIGHT_HIP]
    );
    
    // Enhanced arm length calculation (shoulder to wrist)
    const leftArmLength = getDistance(
      landmarks[LANDMARKS.LEFT_SHOULDER], 
      landmarks[LANDMARKS.LEFT_WRIST]
    );
    const rightArmLength = getDistance(
      landmarks[LANDMARKS.RIGHT_SHOULDER], 
      landmarks[LANDMARKS.RIGHT_WRIST]
    );
    const armLength = (leftArmLength + rightArmLength) / 2;
    
    // Enhanced leg length calculation
    const leftLegLength = getDistance(
      landmarks[LANDMARKS.LEFT_HIP], 
      landmarks[LANDMARKS.LEFT_ANKLE]
    );
    const rightLegLength = getDistance(
      landmarks[LANDMARKS.RIGHT_HIP], 
      landmarks[LANDMARKS.RIGHT_ANKLE]
    );
    const legLength = (leftLegLength + rightLegLength) / 2;
    
    // More accurate height calculation
    const headToAnkle = getDistance(
      landmarks[LANDMARKS.NOSE], 
      landmarks[LANDMARKS.LEFT_ANKLE]
    );
    const height = headToAnkle * 1.15; // Account for head and foot

    // Use calibration data if available, otherwise use default ratio
    const pixelToCmRatio = this.calibrationData?.pixelToCmRatio || 0.5;
    
    // Calculate circumferences using enhanced formulas
    const chestCircumference = getCircumference(shoulderWidth * 1.1, shoulderWidth * 0.8);
    const waistCircumference = getCircumference(hipWidth * 0.9, hipWidth * 0.7);
    const hipCircumference = getCircumference(hipWidth, hipWidth * 0.8);
    
    // Additional measurements for better tailoring
    const neckCircumference = getCircumference(shoulderWidth * 0.3, shoulderWidth * 0.25);
    const bicepCircumference = getCircumference(armLength * 0.15, armLength * 0.12);
    const thighCircumference = getCircumference(legLength * 0.25, legLength * 0.2);

    const measurements: BodyMeasurements = {
      height: Math.round(height * pixelToCmRatio),
      chest: Math.round(chestCircumference * pixelToCmRatio),
      waist: Math.round(waistCircumference * pixelToCmRatio),
      hips: Math.round(hipCircumference * pixelToCmRatio),
      shoulder_width: Math.round(shoulderWidth * pixelToCmRatio),
      arm_length: Math.round(armLength * pixelToCmRatio),
      inseam: Math.round(legLength * pixelToCmRatio * 0.8),
      neck: Math.round(neckCircumference * pixelToCmRatio),
      bicep: Math.round(bicepCircumference * pixelToCmRatio),
      thigh: Math.round(thighCircumference * pixelToCmRatio),
    };

    // Validate measurements for human proportions
    if (!this.validateMeasurements(measurements)) {
      console.warn('Measurements may be inaccurate - please retry scan');
    }

    return measurements;
  }

  // Enhanced measurement validation
  private validateMeasurements(measurements: BodyMeasurements): boolean {
    const { height, chest, waist, hips, shoulder_width, arm_length, inseam } = measurements;
    
    // Check basic human proportions
    const chestToWaistRatio = chest / waist;
    const waistToHipRatio = waist / hips;
    const armToHeightRatio = arm_length / height;
    const shoulderToHeightRatio = shoulder_width / height;
    
    return (
      height > 120 && height < 220 && // Height in cm (4' to 7'3")
      chest > 60 && chest < 150 &&
      waist > 50 && waist < 120 &&
      hips > 60 && hips < 150 &&
      shoulder_width > 30 && shoulder_width < 70 &&
      arm_length > 40 && arm_length < 90 &&
      inseam > 50 && inseam < 120 &&
      chestToWaistRatio > 0.8 && chestToWaistRatio < 1.3 &&
      waistToHipRatio > 0.7 && waistToHipRatio < 1.1 &&
      armToHeightRatio > 0.3 && armToHeightRatio < 0.5 &&
      shoulderToHeightRatio > 0.2 && shoulderToHeightRatio < 0.35
    );
  }

  drawPoseLandmarks(
    canvas: HTMLCanvasElement, 
    landmarks: PoseLandmark[], 
    videoWidth: number, 
    videoHeight: number
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw landmarks
    ctx.fillStyle = '#00ff00';
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * videoWidth;
      const y = landmark.y * videoHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw landmark index
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.fillText(index.toString(), x + 5, y - 5);
      ctx.fillStyle = '#00ff00';
    });

    // Draw pose connections
    this.drawPoseConnections(ctx, landmarks, videoWidth, videoHeight);
  }

  private drawPoseConnections(
    ctx: CanvasRenderingContext2D, 
    landmarks: PoseLandmark[], 
    videoWidth: number, 
    videoHeight: number
  ) {
    const connections = [
      [11, 12], // shoulders
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [11, 23], [12, 24], // torso
      [23, 24], // hips
      [23, 25], [25, 27], // left leg
      [24, 26], [26, 28], // right leg
    ];

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        const startX = landmarks[start].x * videoWidth;
        const startY = landmarks[start].y * videoHeight;
        const endX = landmarks[end].x * videoWidth;
        const endY = landmarks[end].y * videoHeight;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    });
  }
}

// Utility function to check if MediaPipe is supported
export const isMediaPipeSupported = (): boolean => {
  return typeof window !== 'undefined' && 
         'mediaDevices' in navigator && 
         'getUserMedia' in navigator.mediaDevices;
};

// Utility function to get camera constraints
export const getCameraConstraints = () => ({
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    facingMode: 'user',
    frameRate: { ideal: 30, max: 60 }
  }
});

// Enhanced utility function to validate measurements
export const validateMeasurements = (measurements: BodyMeasurements): boolean => {
  const { height, chest, waist, hips, shoulder_width, arm_length, inseam } = measurements;
  
  // Basic range validation
  const basicValidation = (
    height > 120 && height < 220 && // Height in cm (4' to 7'3")
    chest > 60 && chest < 150 &&
    waist > 50 && waist < 120 &&
    hips > 60 && hips < 150 &&
    shoulder_width > 30 && shoulder_width < 70 &&
    arm_length > 40 && arm_length < 90 &&
    inseam > 50 && inseam < 120
  );

  if (!basicValidation) return false;

  // Proportional validation
  const chestToWaistRatio = chest / waist;
  const waistToHipRatio = waist / hips;
  const armToHeightRatio = arm_length / height;
  const shoulderToHeightRatio = shoulder_width / height;

  return (
    chestToWaistRatio > 0.8 && chestToWaistRatio < 1.3 &&
    waistToHipRatio > 0.7 && waistToHipRatio < 1.1 &&
    armToHeightRatio > 0.3 && armToHeightRatio < 0.5 &&
    shoulderToHeightRatio > 0.2 && shoulderToHeightRatio < 0.35
  );
};

// Utility function to calculate measurement confidence
export const calculateMeasurementConfidence = (measurements: BodyMeasurements): number => {
  let confidence = 100;
  
  // Reduce confidence for extreme values
  if (measurements.height < 140 || measurements.height > 200) confidence -= 20;
  if (measurements.chest < 70 || measurements.chest > 130) confidence -= 15;
  if (measurements.waist < 60 || measurements.waist > 110) confidence -= 15;
  
  // Check proportions
  const chestToWaistRatio = measurements.chest / measurements.waist;
  if (chestToWaistRatio < 0.9 || chestToWaistRatio > 1.2) confidence -= 10;
  
  return Math.max(0, confidence);
};

// Utility function to suggest measurement corrections
export const suggestCorrections = (measurements: BodyMeasurements): string[] => {
  const suggestions: string[] = [];
  
  if (measurements.height < 140) {
    suggestions.push("Height seems low - please ensure you're standing straight and fully visible");
  }
  if (measurements.chest < 70) {
    suggestions.push("Chest measurement seems small - ensure arms are at sides and not blocking torso");
  }
  if (measurements.waist > measurements.chest) {
    suggestions.push("Waist measurement is larger than chest - this may indicate a measurement error");
  }
  
  return suggestions;
};
