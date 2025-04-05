import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Button,
  Collapse,
  Paper,
  List
} from '@mui/material';
import { Comment } from '../../types/interfaces';
import { formatDistanceToNow } from 'date-fns';
import parse from 'html-react-parser';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  
  // Format the date
  const formattedDate = formatDistanceToNow(new Date(comment.date), { addSuffix: true });
  
  // Toggle reply form visibility
  const toggleReplyForm = () => {
    setShowReplyForm(!showReplyForm);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          bgcolor: 'background.default',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Avatar 
            src={comment.author_avatar_urls?.['96'] || ''} 
            alt={comment.author_name}
            sx={{ mr: 2, width: 40, height: 40 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                {comment.author_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
            </Box>
            <Box 
              sx={{ 
                mb: 1,
                '& p:last-child': { mb: 0 },
                '& p': { mb: 1 }
              }}
            >
              {parse(comment.content.rendered)}
            </Box>
            <Button 
              variant="text" 
              size="small" 
              onClick={toggleReplyForm}
              sx={{ mt: 1 }}
            >
              {showReplyForm ? 'Cancel Reply' : 'Reply'}
            </Button>
          </Box>
        </Box>
        
        {/* Reply form */}
        <Collapse in={showReplyForm} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, ml: { xs: 0, sm: 6 } }}>
            <CommentForm 
              postId={comment.post}
              parentId={comment.id}
              onCommentSubmitted={() => setShowReplyForm(false)}
            />
          </Box>
        </Collapse>
      </Paper>
      
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <List disablePadding sx={{ pl: { xs: 2, sm: 6 }, mt: 1 }}>
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </List>
      )}
    </Box>
  );
};

export default CommentItem;