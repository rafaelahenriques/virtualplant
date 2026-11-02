/** ml5 ships no types, so this covers only the parts of its API the project uses. */
declare module 'ml5' {
  /** ml5 also exposes each keypoint on the hand by name, with 2D and 3D positions together. */
  export interface NamedHandKeypoint {
    x: number;
    y: number;
    x3D: number;
    y3D: number;
    z3D: number;
  }

  export interface Hand {
    confidence: number;
    keypoints: { x: number; y: number }[];
    wrist: NamedHandKeypoint;
    thumb_tip: NamedHandKeypoint;
    index_finger_tip: NamedHandKeypoint;
    middle_finger_mcp: NamedHandKeypoint;
  }

  export interface HandPose {
    detectStart(media: HTMLVideoElement, callback: (hands: Hand[]) => void): void;
    detectStop(): void;
  }

  const ml5: {
    handPose(options?: { maxHands?: number; flipped?: boolean }): Promise<HandPose>;
  };

  export default ml5;
}
