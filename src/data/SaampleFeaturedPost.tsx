import { WordPressPost } from '../types/interfaces';

// Sample featured post for development/testing purposes
export const sampleFeaturedPost: WordPressPost = {
  id: 999,
  date: '2023-07-15T10:00:00',
  slug: 'sample-featured-post',
  title: {
    rendered: 'Exploring the Future of React and WordPress Integration'
  },
  excerpt: {
    rendered: '<p>Discover how modern React applications can leverage WordPress as a headless CMS to create powerful, flexible, and scalable web experiences. This in-depth guide explores best practices and cutting-edge techniques.</p>'
  },
  content: {
    rendered: '<p>This is sample content for a featured article.</p><p>In a real implementation, this would be the full article content fetched from WordPress.</p>',
    protected: false
  },
  featured_media: 101,
  author: 1,
  categories: [5, 7],
  tags: [11, 15, 18],
  link: '/post/sample-featured-post',
  _embedded: {
    author: [
      {
        name: 'John Developer',
        avatar_urls: {
          '96': 'https://secure.gravatar.com/avatar/placeholder?s=96&d=mm&r=g'
        }
      }
    ],
    'wp:featuredmedia': [
      {
        source_url: 'https://via.placeholder.com/1200x500',
        media_details: {
          sizes: {
            medium: {
              source_url: 'https://via.placeholder.com/800x400'
            }
          }
        }
      }
    ],
    'wp:term': [
      [
        {
          id: 5,
          name: 'React',
          slug: 'react',
          count: 15,
          parent: 0
        },
        {
          id: 7,
          name: 'WordPress',
          slug: 'wordpress',
          count: 22,
          parent: 0
        }
      ],
      [
        {
          id: 11,
          name: 'Headless CMS',
          slug: 'headless-cms',
          count: 8,
          parent: 0
        },
        {
          id: 15,
          name: 'Web Development',
          slug: 'web-development',
          count: 32,
          parent: 0
        }
      ]
    ]
  }
};