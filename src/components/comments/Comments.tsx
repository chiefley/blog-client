// src/components/comments/Comments.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface CommentsProps {
  postId: number;
}

const Comments: React.FC<CommentsProps> = ({ postId }) => {
  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        pb: 2,
        borderBottom: '3px solid',
        borderColor: 'primary.main',
      }}>
        <ChatBubbleOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={600}>
          Comments
        </Typography>
      </Box>
      
      <CommentList postId={postId} />
      <CommentForm postId={postId} />
    </Box>
  );
};

export default Comments;