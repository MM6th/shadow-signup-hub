
/// <reference types="vite/client" />

// Agora RTC SDK types
declare module 'agora-rtc-sdk-ng' {
  // Client types
  export interface IAgoraRTCClient {
    uid: string | number;
    join(appid: string, channel: string, token: string | null, uid: number | null): Promise<number>;
    publish(tracks: Array<ILocalTrack>): Promise<void>;
    unpublish(tracks?: Array<ILocalTrack>): Promise<void>;
    leave(): Promise<void>;
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    subscribe(user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video'): Promise<IRemoteTrack>;
    renewToken(token: string): Promise<void>;
  }

  // Track interfaces
  export interface ILocalTrack {
    play(element: string | HTMLElement): void;
    stop(): void;
    close(): void;
    getTrackId(): string;
    getMediaStreamTrack(): MediaStreamTrack;
    setEnabled(enabled: boolean): Promise<void>;
    setMuted(muted: boolean): Promise<void>;
    enabled: boolean;
  }

  export interface ILocalAudioTrack extends ILocalTrack {
    setVolume(volume: number): void;
  }

  export interface ILocalVideoTrack extends ILocalTrack {
    play(element: string | HTMLElement): void;
  }

  export interface IRemoteTrack {
    play(element?: string | HTMLElement): void;
    stop(): void;
    getTrackId(): string;
    getMediaStreamTrack(): MediaStreamTrack;
    enabled: boolean;
  }

  export interface IRemoteAudioTrack extends IRemoteTrack {
    setVolume(volume: number): void;
  }

  export interface IRemoteVideoTrack extends IRemoteTrack {
    play(element: string | HTMLElement): void;
  }

  export interface IAgoraRTCRemoteUser {
    uid: string | number;
    audioTrack?: IRemoteAudioTrack;
    videoTrack?: IRemoteVideoTrack;
  }

  export interface ClientConfig {
    mode: string;
    codec: string;
  }

  export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTING';
}

// Make AgoraRTC available as a value that can be imported
declare const AgoraRTC: {
  createClient(config: import('agora-rtc-sdk-ng').ClientConfig): import('agora-rtc-sdk-ng').IAgoraRTCClient;
  createMicrophoneAudioTrack(options?: any): Promise<import('agora-rtc-sdk-ng').ILocalAudioTrack>;
  createCameraVideoTrack(options?: any): Promise<import('agora-rtc-sdk-ng').ILocalVideoTrack>;
  createMicrophoneAndCameraTracks(audioOptions?: any, videoOptions?: any): Promise<[import('agora-rtc-sdk-ng').ILocalAudioTrack, import('agora-rtc-sdk-ng').ILocalVideoTrack]>;
};

export default AgoraRTC;
