import { Router, Request, Response } from 'express';
import * as dbService from '../services/db.service';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /admin/mapping
router.post('/mapping', requireAuth, (req: Request, res: Response) => {
  try {
    const { mapping, options } = req.body;
    
    if (!mapping || !mapping.id || !mapping.name) {
      return res.status(400).json({ error: 'Invalid mapping data' });
    }
    
    // Upsert mapping
    const savedMapping = dbService.upsertMapping(mapping);
    
    // Upsert options if provided
    const savedOptions: any[] = [];
    if (options && Array.isArray(options)) {
      for (const option of options) {
        if (!option.id || !option.supplier || !option.title || !option.url || !option.status) {
          return res.status(400).json({ error: 'Invalid option data' });
        }
        savedOptions.push(dbService.upsertOption({ ...option, mappingId: mapping.id }));
      }
    }
    
    // Return mapping with all its options
    const allOptions = dbService.getOptions(mapping.id);
    
    res.json({
      mapping: savedMapping,
      options: allOptions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/mappings - Get all mappings (plural endpoint)
router.get('/mappings', requireAuth, (req: Request, res: Response) => {
  try {
    const mappings = dbService.getAllMappings();
    res.json(mappings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/mapping/:id
router.get('/mapping/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const mapping = dbService.getMapping(id);
    if (!mapping) {
      return res.status(404).json({ error: 'Mapping not found' });
    }
    
    const options = dbService.getOptions(id);
    
    res.json({
      mapping,
      options
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/option - Create new option
router.post('/option', requireAuth, (req: Request, res: Response) => {
  try {
    const { option } = req.body;
    
    if (!option || !option.id || !option.mappingId || !option.supplier || !option.title || !option.url) {
      return res.status(400).json({ error: 'Missing required fields: id, mappingId, supplier, title, url' });
    }
    
    const newOption = dbService.createOption({
      id: option.id,
      mappingId: option.mappingId,
      supplier: option.supplier,
      title: option.title,
      url: option.url,
      status: option.status || 'active',
      priceLastSeen: option.priceLastSeen || null,
      updatedAt: new Date().toISOString()
    });
    
    res.json(newOption);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/option/:id
router.patch('/option/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, url, priceLastSeen } = req.body;
    
    const updates: any = {};
    if (status) updates.status = status;
    if (url) updates.url = url;
    if (priceLastSeen !== undefined) updates.priceLastSeen = priceLastSeen;
    
    const option = dbService.updateOption(id, updates);
    
    if (!option) {
      return res.status(404).json({ error: 'Option not found' });
    }
    
    res.json(option);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/mapping/:id - Delete a mapping and all its options
router.delete('/mapping/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Delete all options for this mapping first
    const options = dbService.getOptions(id);
    for (const option of options) {
      dbService.deleteOption(option.id);
    }
    
    // Delete the mapping
    const deleted = dbService.deleteMapping(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Mapping not found' });
    }
    
    res.json({ message: 'Mapping and all options deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/option/:id - Delete an option
router.delete('/option/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deleted = dbService.deleteOption(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Option not found' });
    }
    
    res.json({ message: 'Option deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/link-health
router.post('/link-health', requireAuth, async (req: Request, res: Response) => {
  try {
    const activeOptions = dbService.getAllActiveOptions();
    const changed: any[] = [];
    
    for (const option of activeOptions) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(option.url, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.status >= 400) {
          dbService.updateOption(option.id, { status: 'inactive' });
          changed.push({
            id: option.id,
            url: option.url,
            status: response.status,
            reason: 'HTTP error'
          });
        }
      } catch (error: any) {
        dbService.updateOption(option.id, { status: 'inactive' });
        changed.push({
          id: option.id,
          url: option.url,
          reason: error.message || 'Timeout/Network error'
        });
      }
    }
    
    res.json({ changed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SUPPLIER ROUTES =====

// GET /admin/suppliers - Get all suppliers
router.get('/suppliers', (req: Request, res: Response) => {
  try {
    const suppliers = dbService.getAllSuppliers();
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/suppliers - Create new supplier
router.post('/suppliers', requireAuth, (req: Request, res: Response) => {
  try {
    const { name, url } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Generate slug from name
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const supplier = dbService.createSupplier({
      id,
      name,
      url: url || '',
      active: 1,
      createdAt: new Date().toISOString()
    });
    
    res.json(supplier);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/suppliers/:id - Update supplier
router.patch('/suppliers/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, url, active } = req.body;
    
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;
    if (active !== undefined) updates.active = active ? 1 : 0;
    
    const supplier = dbService.updateSupplier(id, updates);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/suppliers/:id - Delete supplier
router.delete('/suppliers/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deleted = dbService.deleteSupplier(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json({ message: 'Supplier deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;