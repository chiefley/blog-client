// src/components/shortcodes/su/SuYoutube.tsx
import React from 'react';
import { Box } from '@mui/material';
import { ShortcodeComponentProps } from '../ShortcodeRegistry';

const SuYoutube: React.FC<ShortcodeComponentProps> = ({ attributes }) => {
  const {
    url,
    width = '600',
    height = '400',
    responsive = 'yes',
    autoplay = 'no',
    mute = 'no',
    controls = 'yes',
    loop = 'no',
    rel = 'no',
    fs = 'yes',
    modestbranding = 'no',
    theme = 'dark',
    wmode = 'opaque',
    playsinline = 'no',
    privacy = 'no',
    class: className,
    title = 'YouTube video',
  } = attributes || {};

  // Extract video ID from various YouTube URL formats
  const getVideoId = (videoUrl: string): string | null => {
    if (!videoUrl) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  const videoId = getVideoId(url);
  
  if (!videoId) {
    return (
      <Box
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: 'error.main',
          borderRadius: 1,
          textAlign: 'center',
          color: 'error.main',
          my: 2,
        }}
      >
        Invalid YouTube URL
      </Box>
    );
  }

  // Build embed URL with parameters
  const embedParams = new URLSearchParams({
    ...(autoplay === 'yes' && { autoplay: '1' }),
    ...(mute === 'yes' && { mute: '1' }),
    ...(controls === 'no' && { controls: '0' }),
    ...(loop === 'yes' && { loop: '1', playlist: videoId }),
    ...(rel === 'no' && { rel: '0' }),
    ...(fs === 'no' && { fs: '0' }),
    ...(modestbranding === 'yes' && { modestbranding: '1' }),
    ...(playsinline === 'yes' && { playsinline: '1' }),
    theme: theme,
    wmode: wmode,
  });

  const embedUrl = privacy === 'yes' 
    ? `https://www.youtube-nocookie.com/embed/${videoId}?${embedParams}`
    : `https://www.youtube.com/embed/${videoId}?${embedParams}`;

  if (responsive === 'yes') {
    return (
      <Box
        sx={{
          position: 'relative',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          height: 0,
          overflow: 'hidden',
          maxWidth: '100%',
          my: 2,
        }}
        className={className}
      >
        <iframe
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        my: 2,
        display: 'flex',
        justifyContent: 'center',
      }}
      className={className}
    >
      <iframe
        src={embedUrl}
        title={title}
        width={width}
        height={height}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </Box>
  );
};

export default SuYoutube;