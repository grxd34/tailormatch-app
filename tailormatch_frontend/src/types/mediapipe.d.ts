declare module '@mediapipe/pose' {
  export class Pose {
    constructor(config: {
      locateFile: (file: string) => string;
    });
    setOptions(options: {
      modelComplexity: number;
      smoothLandmarks: boolean;
      enableSegmentation: boolean;
      smoothSegmentation: boolean;
      minDetectionConfidence: number;
      minTrackingConfidence: number;
    }): void;
    onResults(callback: (results: any) => void): void;
    send(data: { image: HTMLVideoElement }): Promise<void>;
  }
}

declare module '@mediapipe/camera_utils' {
  export class Camera {
    constructor(videoElement: HTMLVideoElement, config: {
      onFrame: () => Promise<void>;
      width: number;
      height: number;
    });
    start(): Promise<void>;
    stop(): void;
  }
}
