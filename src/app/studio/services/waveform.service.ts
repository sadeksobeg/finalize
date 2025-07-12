import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import WaveSurfer from 'wavesurfer.js';

/**
 * Professional Waveform Service
 * Handles audio waveform generation and visualization using WaveSurfer.js
 */
@Injectable({
  providedIn: 'root'
})
export class WaveformService {
  private waveformCache = new Map<string, number[]>();
  private waveformInstances = new Map<string, WaveSurfer>();

  constructor() {}

  /**
   * Generate waveform data from audio/video file
   */
  async generateWaveform(
    audioUrl: string, 
    options: {
      samples?: number;
      quality?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<number[]> {
    const cacheKey = `${audioUrl}_${options.samples || 1000}_${options.quality || 'medium'}`;
    
    if (this.waveformCache.has(cacheKey)) {
      return this.waveformCache.get(cacheKey)!;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const samples = options.samples || 1000;
      const waveformData = this.extractWaveformData(audioBuffer, samples);
      
      this.waveformCache.set(cacheKey, waveformData);
      return waveformData;
    } catch (error) {
      console.error('Error generating waveform:', error);
      return [];
    }
  }

  /**
   * Create WaveSurfer instance for timeline clip
   */
  createTimelineWaveform(
    container: HTMLElement,
    audioUrl: string,
    options: {
      height?: number;
      color?: string;
      progressColor?: string;
      responsive?: boolean;
    } = {}
  ): WaveSurfer {
    const wavesurfer = WaveSurfer.create({
      container,
      waveColor: options.color || '#4a90e2',
      progressColor: options.progressColor || '#2c5aa0',
      height: options.height || 40,
      responsive: options.responsive !== false,
      normalize: true,
      backend: 'WebAudio',
      mediaControls: false,
      interact: true,
      cursorColor: '#ff6b35',
      cursorWidth: 2,
      barWidth: 1,
      barGap: 1,
      barRadius: 1
    });

    wavesurfer.load(audioUrl);
    
    const instanceId = `timeline_${Date.now()}_${Math.random()}`;
    this.waveformInstances.set(instanceId, wavesurfer);
    
    return wavesurfer;
  }

  /**
   * Extract waveform data from AudioBuffer
   */
  private extractWaveformData(audioBuffer: AudioBuffer, samples: number): number[] {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    const waveformData: number[] = [];

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      const end = start + blockSize;
      let sum = 0;

      for (let j = start; j < end; j++) {
        sum += Math.abs(channelData[j]);
      }

      waveformData.push(sum / blockSize);
    }

    // Normalize to 0-1 range
    const max = Math.max(...waveformData);
    return waveformData.map(value => value / max);
  }

  /**
   * Cleanup waveform instance
   */
  destroyWaveform(instanceId: string): void {
    const instance = this.waveformInstances.get(instanceId);
    if (instance) {
      instance.destroy();
      this.waveformInstances.delete(instanceId);
    }
  }

  /**
   * Clear all cached waveforms
   */
  clearCache(): void {
    this.waveformCache.clear();
    this.waveformInstances.forEach(instance => instance.destroy());
    this.waveformInstances.clear();
  }
}