import api from './api';

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  readTime: number;
  lastUpdated: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'general';
  priority: 'low' | 'medium' | 'high';
}

export const helpSupportService = {
  // Get help articles
  async getArticles(category?: string, search?: string): Promise<HelpArticle[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const response = await api.get(`/help/articles?${params.toString()}`);
    return response.data.articles;
  },

  // Get specific help article
  async getArticle(id: string): Promise<HelpArticle> {
    const response = await api.get(`/help/articles/${id}`);
    return response.data.article;
  },

  // Search help articles
  async searchArticles(query: string): Promise<HelpArticle[]> {
    const response = await api.get(`/help/search?q=${encodeURIComponent(query)}`);
    return response.data.articles;
  },

  // Get FAQ
  async getFAQ(): Promise<{ question: string; answer: string }[]> {
    const response = await api.get('/help/faq');
    return response.data.faq;
  },

  // Submit support ticket
  async createTicket(ticketData: ContactForm): Promise<SupportTicket> {
    const response = await api.post('/support/tickets', ticketData);
    return response.data.ticket;
  },

  // Get user's support tickets
  async getUserTickets(): Promise<SupportTicket[]> {
    const response = await api.get('/support/tickets');
    return response.data.tickets;
  },

  // Get specific support ticket
  async getTicket(id: string): Promise<SupportTicket> {
    const response = await api.get(`/support/tickets/${id}`);
    return response.data.ticket;
  },

  // Update support ticket
  async updateTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const response = await api.put(`/support/tickets/${id}`, updates);
    return response.data.ticket;
  },

  // Send contact form
  async sendContactForm(formData: ContactForm): Promise<void> {
    await api.post('/support/contact', formData);
  },

  // Get support categories
  async getCategories(): Promise<string[]> {
    const response = await api.get('/help/categories');
    return response.data.categories;
  }
};

export default helpSupportService;
