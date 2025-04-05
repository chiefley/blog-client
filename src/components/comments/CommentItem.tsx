// src/components/comments/CommentItem.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Button,
  Collapse,
  Paper,
  List,
  Divider
} from '@mui/material';
import { Comment } from '../../types/interfaces';
import { formatDistanceToNow } from 'date-fns';
import parse from 'html-react-parser';
import CommentForm from './CommentForm';
import ReplyIcon from '@mui/icons-material/Reply';

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
    <Box sx={{ mb: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          bgcolor: 'background.default',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Avatar 
            src={comment.author_avatar_urls?.['96'] || ''} 
            alt={comment.author_name}
            sx={{ 
              mr: 2, 
              width: 48, 
              height: 48,
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              border: '2px solid white'
            }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="subtitle1" component="span" sx={{ 
                fontWeight: 'bold', 
                mr: 1,
                color: 'primary.dark'
              }}>
                {comment.author_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box 
              sx={{ 
                mb: 2,
                '& p:last-child': { mb: 0 },
                '& p': { 
                  mb: 1.5,
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: 'text.primary'
                },
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }
              }}
            >
              {parse(comment.content.rendered)}
            </Box>
            <Button 
              variant="text" 
              size="small" 
              onClick={toggleReplyForm}
              startIcon={<ReplyIcon fontSize="small" />}
              sx={{ 
                mt: 1,
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              {showReplyForm ? 'Cancel Reply' : 'Reply'}
            </Button>
          </Box>
        </Box>
        
        {/* Reply form */}
        <Collapse in={showReplyForm} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 3, ml: { xs: 0, sm: 6 } }}>
            <CommentForm 
              postId={comment.post}
              parentId={comment.id}
              onCommentSubmitted={() => setShowReplyForm(false)}
            />
          </Box>
        </Collapse>
      </Paper>
      
      {/* Replies - with indentation and connecting line */}
      {comment.replies && comment.replies.length > 0 && (
        <List disablePadding sx={{ 
          pl: { xs: 3, sm: 6 }, 
          mt: 1,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: { xs: 10, sm: 24 },
            top: 0,
            bottom: 40,
            width: 2,
            backgroundColor: 'divider',
            zIndex: 0
          }
        }}>
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </List>
      )}
    </Box>
  );
};

export default CommentItem;