// app/api/docs/route.ts
// OpenAPI Documentation endpoint

import { NextResponse } from 'next/server';

export async function GET() {
  const openapi = {
    openapi: '3.0.0',
    info: {
      title: 'Scripture AI API',
      description: 'Bible reading app with AI-powered features. Access Bible verses, manage highlights/notes, generate AI insights, and more.',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@scripture-ai.com'
      }
    },
    servers: [
      {
        url: 'https://api.scripture-ai.com',
        description: 'Production server'
      }
    ],
    paths: {
      '/api/bible': {
        get: {
          summary: 'Get Bible verses',
          description: 'Retrieve Bible verses by book, chapter, and version',
          parameters: [
            { name: 'bookId', in: 'query', required: true, schema: { type: 'string', example: 'gen' } },
            { name: 'chapter', in: 'query', required: true, schema: { type: 'integer', example: 1 } },
            { name: 'version', in: 'query', schema: { type: 'string', default: 'CUV' } }
          ],
          responses: {
            '200': { description: 'Success', content: { 'application/json': { example: { verses: [] } } } }
          }
        }
      },
      '/api/search': {
        get: {
          summary: 'Search Bible verses',
          description: 'Search verses by keyword with multiple search modes',
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string', example: '神爱世人' } },
            { name: 'mode', in: 'query', schema: { type: 'string', enum: ['exact', 'fuzzy', 'ai'] } }
          ]
        }
      },
      '/api/chat': {
        post: {
          summary: 'AI Bible Chat',
          description: 'Get AI-powered insights about Bible verses',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    messages: { type: 'array' },
                    context: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      },
      '/api/chat/tutor': {
        post: {
          summary: 'AI Tutor - Socratic Learning',
          description: 'Bible study with Socratic questioning method'
        }
      },
      '/api/chat/study-guide': {
        post: {
          summary: 'Generate Study Guide',
          description: 'Create group Bible study materials'
        }
      },
      '/api/chat/sermon': {
        post: {
          summary: 'Generate Sermon Outline',
          description: 'Create sermon outlines from Bible passages'
        }
      },
      '/api/memory': {
        get: { summary: 'Get due memory cards' },
        post: { summary: 'Add memory card' },
        put: { summary: 'Review memory card' }
      },
      '/api/highlight': {
        get: { summary: 'List highlights' },
        post: { summary: 'Create highlight' },
        delete: { summary: 'Delete highlight' }
      },
      '/api/note': {
        get: { summary: 'List notes' },
        post: { summary: 'Create note' },
        put: { summary: 'Update note' },
        delete: { summary: 'Delete note' }
      },
      '/api/versions': {
        get: { summary: 'List Bible versions' },
        post: { summary: 'Add new version (admin)' }
      },
      '/api/friends': {
        get: { summary: 'List friends' },
        post: { summary: 'Add friend' },
        delete: { summary: 'Remove friend' }
      },
      '/api/posts': {
        get: { summary: 'List community posts' },
        post: { summary: 'Create post' }
      },
      '/api/church': {
        get: { summary: 'List churches/groups' },
        post: { summary: 'Create church' }
      },
      '/api/reminder': {
        get: { summary: 'List reminders' },
        post: { summary: 'Set reminder' },
        delete: { summary: 'Delete reminder' }
      },
      '/api/user/api-keys': {
        get: { summary: 'List API keys' },
        post: { summary: 'Create API key' },
        delete: { summary: 'Revoke API key' }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [
      { bearerAuth: [] },
      { apiKey: [] }
    ]
  };

  return NextResponse.json(openapi);
}
