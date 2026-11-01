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

  /** ml5 also exposes each keypoint on the hand by name, with 2D and 3D positions together. */
  export interface NamedHandKeypoint {
    x: number;
    y: number;
    x3D: number;
    y3D: number;
    z3D: number;
  }

  export interface Hand {
    handedness: 'Left' | 'Right';
    confidence: number;
    keypoints: HandKeypoint[];
    keypoints3D: HandKeypoint3D[];
    wrist: NamedHandKeypoint;
    thumb_tip: NamedHandKeypoint;
    index_finger_tip: NamedHandKeypoint;
    middle_finger_mcp: NamedHandKeypoint;
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
