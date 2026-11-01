/** ml5 ships no types, so this covers only the parts of its API the project uses. */
declare module 'ml5' {
  export interface HandKeypoint {
    x: number;
    y: number;
    name: string;
  }

  export interface HandKeypoint3D {
    x: number;
    y: number;
    z: number;
    name: string;
  }

  export interface Hand {
    handedness: 'Left' | 'Right';
    confidence: number;
    keypoints: HandKeypoint[];
    keypoints3D: HandKeypoint3D[];
  }

  export interface HandPoseOptions {
    maxHands?: number;
    flipped?: boolean;
    runtime?: 'tfjs' | 'mediapipe';
    modelType?: 'lite' | 'full';
  }

  export interface HandPose {
    detectStart(media: HTMLVideoElement, callback: (hands: Hand[]) => void): void;
    detectStop(): void;
  }

  const ml5: {
    handPose(options?: HandPoseOptions): Promise<HandPose>;
  };

  export default ml5;
}
