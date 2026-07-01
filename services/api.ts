const API_BASE = import.meta.env.VITE_API_BASE + '/api';

const parseField = (val: any): any[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return [];
};

export const apiService = {
  async getProducts() {
    const res = await fetch(`${API_BASE}/products`);
    return res.json();
  },

  async addProduct(product: any) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return res.json();
  },
  async updateProduct(product: any) {
    const res = await fetch(`${API_BASE}/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });

    if (!res.ok) {
      throw new Error('Error actualizando producto');
    }

    return res.json();
  },
  async getEvents() {
    const res = await fetch(`${API_BASE}/events`);
    return res.json();
  },

  async addEvent(event: any) {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    return res.json();
  },

  async deleteEvent(id: string) {
    const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getRegistrations() {
    const res = await fetch(`${API_BASE}/registrations`);
    return res.json();
  },

  async registerTeam(registration: any) {
    const res = await fetch(`${API_BASE}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration)
    });
    return res.json();
  },

  async deleteRegistration(id: string) {
    const res = await fetch(`${API_BASE}/registrations/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`);
    return res.json();
  },

  async deleteOrder(id: string) {
    const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async placeOrder(order: any) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return res.json();
  },

  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    return {
      ...data,
      ambassadorsImage: parseField(data.ambassadorsImage),
      sponsorsImage: parseField(data.sponsorsImage),
      photoTrayectoriaBachestic: data.photoTrayectoriaBachestic || '',
      photoTrayectoriaElite: data.photoTrayectoriaElite || '',
      heroBachestic: data.heroBachestic || '',
      heroElite: data.heroElite || '',
      statYear: data.statYear || '2015',
      statCollections: data.statCollections || '50+',
      statEliteEvents: data.statEliteEvents || '50+'
    };
  },

  async updateSettings(settings: any) {
    const payload = {
      ...settings,
      ambassadorsImage: Array.isArray(settings.ambassadorsImage)
        ? JSON.stringify(settings.ambassadorsImage)
        : settings.ambassadorsImage,
      sponsorsImage: Array.isArray(settings.sponsorsImage)
        ? JSON.stringify(settings.sponsorsImage)
        : settings.sponsorsImage,
      photoTrayectoriaBachestic: settings.photoTrayectoriaBachestic || '',
      photoTrayectoriaElite: settings.photoTrayectoriaElite || '',
      heroBachestic: settings.heroBachestic || '',
      heroElite: settings.heroElite || '',
      statYear: settings.statYear || '2015',
      statCollections: settings.statCollections || '50+',
      statEliteEvents: settings.statEliteEvents || '50+',
    };
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async login(pin: string) {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    return res.json();
  },

  async getGallery() {
    const res = await fetch(`${API_BASE}/gallery`);
    return res.json();
  },

  async addGalleryItem(url: string, projectId?: number) {
    const res = await fetch(`${API_BASE}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, project_id: projectId ?? null }),
    });
    return res.json();
  },
  async updateGalleryItemProject(id: number, project_id: number | null) {
    const res = await fetch(`${API_BASE}/gallery/${id}/project`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id }),
    });
    return res.json();
  },
  async deleteGalleryItem(id: number) {
    const res = await fetch(`${API_BASE}/gallery/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getGalleryProjects() {
    const res = await fetch(`${API_BASE}/gallery/projects`);
    return res.json();
  },

  async addGalleryProject(project: { name: string; description?: string; cover_image?: string }) {
    const res = await fetch(`${API_BASE}/gallery/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return res.json();
  },

  async deleteGalleryProject(id: number) {
    const res = await fetch(`${API_BASE}/gallery/projects/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // ── SPONSORS (Patrocinadores) ──────────────────────────────

  async createSponsor(data: { name: string; email: string; phone?: string; password: string; commission_percent?: number }) {
    const res = await fetch(`${API_BASE}/sponsors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async loginSponsor(email: string, password: string) {
    const res = await fetch(`${API_BASE}/sponsors/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async getSponsors() {
    const res = await fetch(`${API_BASE}/sponsors`);
    return res.json();
  },

  async updateSponsor(id: number, data: any) {
    const res = await fetch(`${API_BASE}/sponsors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateSponsorStatus(id: number, status: string) {
    const res = await fetch(`${API_BASE}/sponsors/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async deleteSponsor(id: number) {
    const res = await fetch(`${API_BASE}/sponsors/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getSponsorStats(code: string) {
    const res = await fetch(`${API_BASE}/sponsors/${code}/stats`);
    return res.json();
  },

  async getSponsorCommissions(code: string) {
    const res = await fetch(`${API_BASE}/sponsors/${code}/commissions`);
    return res.json();
  },

  async getSponsorProductCommissions(code: string) {
    const res = await fetch(`${API_BASE}/sponsors/${code}/product-commissions`);
    return res.json();
  },

  async setSponsorProductCommission(code: string, product_id: string, commission_percent: number) {
    const res = await fetch(`${API_BASE}/sponsors/${code}/product-commissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, commission_percent }),
    });
    return res.json();
  },

  async trackSponsorClick(sponsor_code: string) {
    const res = await fetch(`${API_BASE}/sponsors/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsor_code }),
    });
    return res.json();
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/sponsors/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async resetPassword(token: string, password: string) {
    const res = await fetch(`${API_BASE}/sponsors/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    return res.json();
  },

  async changePassword(sponsor_code: string, currentPassword: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/sponsors/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsor_code, currentPassword, newPassword }),
    });
    return res.json();
  },

};
