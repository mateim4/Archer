import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { mockHardwareBaskets, mockClusterData, mockProjectData } from './mock-data';

// Define request handlers
export const handlers = [
  // Hardware baskets API
  http.get('/api/hardware-baskets', () => {
    return HttpResponse.json({ baskets: mockHardwareBaskets });
  }),

  http.post('/api/hardware-baskets', async ({ request }) => {
    const newBasket = await request.json();
    const createdBasket = {
      id: 'basket-' + Date.now(),
      ...newBasket,
      status: 'pending',
      uploadDate: new Date().toISOString(),
      processedDate: null,
      models: []
    };
    return HttpResponse.json(createdBasket, { status: 201 });
  }),

  http.get('/api/hardware-baskets/:id', ({ params }) => {
    const basket = mockHardwareBaskets.find(b => b.id === params.id);
    if (!basket) {
      return HttpResponse.json({ error: 'Basket not found' }, { status: 404 });
    }
    return HttpResponse.json(basket);
  }),

  http.delete('/api/hardware-baskets/:id', ({ params }) => {
    return HttpResponse.json({ success: true }, { status: 204 });
  }),

  // Capacity data API
  http.get('/api/capacity/clusters', () => {
    return HttpResponse.json({ clusters: mockClusterData });
  }),

  // Projects API
  http.get('/api/projects', () => {
    return HttpResponse.json({ projects: [mockProjectData] });
  }),

  http.post('/api/projects', async ({ request }) => {
    const newProject = await request.json();
    const createdProject = {
      id: 'project-' + Date.now(),
      ...newProject,
      status: 'active',
      activities: [],
      team: []
    };
    return HttpResponse.json(createdProject, { status: 201 });
  }),

  // File upload API
  http.post('/api/upload/hardware-basket', () => {
    return HttpResponse.json({
      success: true,
      message: 'File uploaded successfully',
      basketId: 'basket-' + Date.now()
    });
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  })
];

// Setup server
export const server = setupServer(...handlers);

// Server setup for tests - simplified for MSW v2
export const setupMockServer = () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });
  
  afterEach(() => {
    server.resetHandlers();
  });
  
  afterAll(() => {
    server.close();
  });
};