import { Box, Pagination, Grid } from '@mui/material';
import PostCard from './PostCard';
import { PostListProps } from '../../types/interfaces';

const PostList = ({ posts, currentPage, totalPages, onPageChange }: PostListProps) => {
  return (
    <Box>
      <Grid container spacing={3} direction="column">
        {posts.map(post => (
          <Grid item key={post.id}>
            <PostCard post={post} />
          </Grid>
        ))}
      </Grid>
      
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={(_, page) => onPageChange(page)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default PostList;