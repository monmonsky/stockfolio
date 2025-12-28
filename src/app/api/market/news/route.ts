import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface GoAPINewsResponse {
  status: string
  data: {
    results: Array<{
      title: string
      description: string
      url: string
      image: string
      published_at: string
      source: string
    }>
  }
}

// GET - Read from database
export async function GET() {
  try {
    const news = await prisma.marketNews.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 20
    })

    const latestUpdate = news.length > 0 ? news[0].createdAt : null

    return NextResponse.json({
      success: true,
      data: news.map(item => ({
        title: item.title,
        description: item.description,
        url: item.url,
        image: item.image,
        publishedAt: item.publishedAt.toISOString(),
        source: item.source
      })),
      fromCache: true,
      updatedAt: latestUpdate
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

// POST - Refresh from API and save to database
// Note: GoAPI does not provide news endpoint. Using GNews API for Indonesian business news
export async function POST() {
  try {
    // Using GNews API (free tier: 100 requests/day)
    // Get API key from https://gnews.io/
    const gnewsApiKey = process.env.GNEWS_API_KEY

    console.log('GNEWS_API_KEY exists:', !!gnewsApiKey)

    if (!gnewsApiKey) {
      // If no GNews API key, return message
      return NextResponse.json({
        success: false,
        error: 'Fitur berita memerlukan GNEWS_API_KEY. Dapatkan API key gratis di https://gnews.io/'
      }, { status: 400 })
    }

    // Use simpler query for better results
    const url = `https://gnews.io/api/v4/top-headlines?category=business&lang=id&country=id&max=10&apikey=${gnewsApiKey}`
    console.log('Fetching news from:', url.replace(gnewsApiKey, '***'))

    const response = await fetch(url, { cache: 'no-store' })

    console.log('GNews response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GNews API error:', errorText)
      return NextResponse.json(
        { success: false, error: `Failed to fetch news: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.articles && data.articles.length > 0) {
      // Insert new news (skip duplicates based on URL)
      for (const item of data.articles) {
        try {
          await prisma.marketNews.upsert({
            where: { url: item.url },
            update: {
              title: item.title,
              description: item.description || '',
              image: item.image || '',
              publishedAt: new Date(item.publishedAt),
              source: item.source?.name || 'Unknown'
            },
            create: {
              title: item.title,
              description: item.description || '',
              url: item.url,
              image: item.image || '',
              publishedAt: new Date(item.publishedAt),
              source: item.source?.name || 'Unknown'
            }
          })
        } catch {
          // Skip if URL already exists or other error
          continue
        }
      }

      // Fetch updated news from database
      const news = await prisma.marketNews.findMany({
        orderBy: { publishedAt: 'desc' },
        take: 20
      })

      return NextResponse.json({
        success: true,
        data: news.map(item => ({
          title: item.title,
          description: item.description,
          url: item.url,
          image: item.image,
          publishedAt: item.publishedAt.toISOString(),
          source: item.source
        })),
        fromCache: false,
        updatedAt: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      data: [],
      fromCache: false,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error refreshing news:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to refresh news' },
      { status: 500 }
    )
  }
}
