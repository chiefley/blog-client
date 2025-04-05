import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

interface CommentsProps {
  postId: number;
}

const Comments: React.FC<CommentsProps> = ({ postId }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Comments
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <CommentList postId={postId} />
      <CommentForm postId={postId} />
    </Box>
  );
};

export default Comments;