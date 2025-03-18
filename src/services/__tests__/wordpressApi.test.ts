import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getPosts } from '../wordpressApi'

// Mock data for tests
const mockPosts = [
    {
        id: 1,
        date: '2023-01-01T12:00:00',
        slug: 'test-post',
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: '<p>Test excerpt</p>' },
        featured_media: 123,
        author: 1,
        categories: [1, 2],
        tags: [3, 4],
        _embedded: {
            author: [{ id: 1, name: 'Test Author', avatar_urls: { '96': 'test.jpg' } }],
            'wp:featuredmedia': [{ source_url: 'featured.jpg', alt_text: 'Featured image' }],
            'wp:term': [
                [{ id: 1, name: 'Category 1', slug: 'category-1', taxonomy: 'category' }],
                [{ id: 3, name: 'Tag 1', slug: 'tag-1', taxonomy: 'post_tag' }]
            ]
        }
    }
]

// Setup MSW server to intercept API requests
const server = setupServer(
    http.get('https://wpcms.thechief.com/wp-json/wp/v2/posts', () => {
        return HttpResponse.json(mockPosts, {
            headers: {
                'X-WP-TotalPages': '1'
            }
        })
    })
)

// Start server before tests
beforeAll(() => server.listen())

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Close server after all tests
afterAll(() => server.close())

describe('WordPress API Service', () => {
    it('fetches posts successfully', async () => {
        const result = await getPosts()
        expect(result.posts).toEqual(mockPosts)
        expect(result.totalPages).toBe(1)
    })

    it('handles errors gracefully', async () => {
        // Mock a server error
        server.use(
            http.get('https://wpcms.thechief.com/wp-json/wp/v2/posts', () => {
                return new HttpResponse(null, { status: 500 })
            })
        )

        const result = await getPosts()
        expect(result.posts).toEqual([])
        expect(result.totalPages).toBe(0)
    })

    it('applies filtering parameters correctly', async () => {
        // Spy on fetch to check the URL parameters
        const fetchSpy = vi.spyOn(global, 'fetch')

        await getPosts({
            page: 2,
            perPage: 5,
            categoryId: 10,
            search: 'test'
        })

        const url = fetchSpy.mock.calls[0][0] as string
        expect(url).toContain('page=2')
        expect(url).toContain('per_page=5')
        expect(url).toContain('categories=10')
        expect(url).toContain('search=test')
    })
})