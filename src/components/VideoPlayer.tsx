
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X, ThumbsUp, Maximize, Minimize } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  src: string;
  title: string;
  videoId: string;
  userId: string;
  onClose?: () => void;
  inDialog?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  title, 
  videoId, 
  userId, 
  onClose,
  inDialog = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0.7);
  const [temperature, setTemperature] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch the current temperature for this video
  useEffect(() => {
    const fetchTemperature = async () => {
      try {
        // Get demand_meter data for this video
        const { data, error } = await supabase
          .from('video_demand_meters')
          .select('temperature')
          .eq('video_path', videoId)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching video temperature:', error);
        } else if (data) {
          setTemperature(data.temperature);
        }
        
        // Check if current user has already voted
        const sessionKey = `voted_${videoId}`;
        if (localStorage.getItem(sessionKey)) {
          setHasVoted(true);
        }
      } catch (err) {
        console.error('Error in temperature fetch:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemperature();
  }, [videoId]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setCurrentVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      
      // If volume is set to 0, mute the video
      if (newVolume === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        // If volume is increased from 0, unmute the video
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleIncreaseTemperature = async () => {
    if (hasVoted) {
      toast({
        title: "Already voted",
        description: "You've already voted for this video",
        variant: "default"
      });
      return;
    }
    
    try {
      const newTemperature = temperature + 1;
      
      // Reset if it exceeds 30
      const finalTemperature = newTemperature > 30 ? 0 : newTemperature;
      
      // Check if record exists
      const { data } = await supabase
        .from('video_demand_meters')
        .select('id')
        .eq('video_path', videoId)
        .single();
      
      // Update or insert temperature
      if (data) {
        await supabase
          .from('video_demand_meters')
          .update({ temperature: finalTemperature })
          .eq('video_path', videoId);
      } else {
        await supabase
          .from('video_demand_meters')
          .insert({ 
            video_path: videoId,
            temperature: finalTemperature,
            user_id: userId
          });
      }
      
      // Record the vote in transit records
      await supabase
        .from('video_transit_records')
        .insert({
          video_path: videoId,
          user_id: userId
        });
      
      // Mark as voted in local storage
      const sessionKey = `voted_${videoId}`;
      localStorage.setItem(sessionKey, 'true');
      
      setTemperature(finalTemperature);
      setHasVoted(true);
      
      toast({
        title: "Vote recorded",
        description: "Thanks for your feedback!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating temperature:', error);
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive"
      });
    }
  };

  // Calculate color gradient based on temperature
  const calculateGradient = () => {
    // Temperature range: 0-30
    // Color transition: blue (cold) -> purple -> red (hot)
    const ratio = temperature / 30;
    
    if (ratio <= 0.5) {
      // From blue to purple
      const blueRatio = 1 - ratio * 2;
      const r = Math.round(137 * (1 - blueRatio));
      const g = Math.round(87 * (1 - blueRatio));
      const b = 255;
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // From purple to red
      const redRatio = (ratio - 0.5) * 2;
      const r = Math.round(137 + (255 - 137) * redRatio);
      const g = Math.round(87 * (1 - redRatio));
      const b = Math.round(255 * (1 - redRatio));
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const temperatureColor = calculateGradient();
  
  return (
    <div 
      ref={containerRef} 
      className={`relative bg-dark-secondary rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className={`w-full ${inDialog ? 'h-auto aspect-video' : 'rounded-t-lg'}`}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={handlePlayPause}
      />
      
      {/* Title */}
      <div className="p-3 border-b border-gray-800">
        <h3 className="font-medium truncate">{title}</h3>
      </div>
      
      {/* Controls */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handlePlayPause}
            className="p-2 rounded-full hover:bg-dark-accent"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button 
            onClick={handleMuteToggle}
            className="p-2 rounded-full hover:bg-dark-accent"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <div className="w-24">
            <Slider
              value={[currentVolume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-dark-accent"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-dark-accent"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      
      {/* Demand Meter */}
      <div className="pb-4 px-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Demand Meter</span>
          <div className="flex items-center">
            <span className="text-sm mr-2">{temperature}/30</span>
            <button
              onClick={handleIncreaseTemperature}
              disabled={hasVoted}
              className={`p-1.5 rounded-full ${hasVoted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark-accent'}`}
              title={hasVoted ? "You've already voted" : "Like this video"}
            >
              <ThumbsUp size={16} className={hasVoted ? 'text-pi-focus' : 'text-gray-400'} />
            </button>
          </div>
        </div>
        
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300 ease-in-out"
            style={{ 
              width: `${(temperature / 30) * 100}%`,
              backgroundColor: temperatureColor
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
