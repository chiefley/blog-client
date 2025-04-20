// src/components/posts/LazyComments.tsx
import React, { useState, lazy, Suspense } from 'react';
import { Box, Button, CircularProgress, Collapse } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

// Lazy load the comments component
const Comments = lazy(() => import('../comments/Comments'));

interface LazyCommentsProps {
  postId: number;
}

const LazyComments: React.FC<LazyCommentsProps> = ({ postId }) => {
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const handleToggleComments = () => {
    setCommentsVisible(prev => !prev);
    
    // Once opened, mark as loaded so we don't unload the component
    if (!commentsLoaded && !commentsVisible) {
      setCommentsLoaded(true);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<ChatBubbleOutlineIcon />}
        endIcon={commentsVisible ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        onClick={handleToggleComments}
        fullWidth
        size="large"
        sx={{ 
          borderRadius: 2,
          py: 1.5,
          fontWeight: 'medium',
          mb: 2
        }}
      >
        {commentsVisible ? 'Hide Comments' : 'Show Comments'}
      </Button>

      <Collapse in={commentsVisible} timeout="auto" unmountOnExit={!commentsLoaded}>
        <Box sx={{ 
          p: 2, 
          borderRadius: 2, 
          bgcolor: 'background.paper',
          minHeight: commentsLoaded ? 'auto' : '200px'
        }}>
          {commentsVisible && (
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            }>
              <Comments postId={postId} />
            </Suspense>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default LazyComments;