import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaPlus, FaTrash, FaEye, FaUpload, FaFileImport } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const AdminPage = ({ sessionId }) => {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const [newBrand, setNewBrand] = useState({
    name: '',
    website: '',
    logo_url: ''
  });

  const [newProduct, setNewProduct] = useState({
    brand_id: '',
    name: '',
    category_key: '',
    product_url: '',
    price: '',
    size: '',
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [brandsRes, productsRes] = await Promise.all([
        axios.get(`${API}/brands`),
        axios.get(`${API}/products`)
      ]);
      setBrands(brandsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Kunne ikke hente data');
    } finally {
      setLoading(false);
    }
  };

  const addBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.name || !newBrand.website) {
      toast.error('Udfyld navn og hjemmeside');
      return;
    }

    try {
      await axios.post(`${API}/brands`, newBrand);
      toast.success('Brand tilføjet!');
      setIsAddBrandOpen(false);
      setNewBrand({ name: '', website: '', logo_url: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding brand:', error);
      toast.error('Kunne ikke tilføje brand');
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.brand_id || !newProduct.name || !newProduct.category_key || !newProduct.product_url) {
      toast.error('Udfyld alle påkrævede felter');
      return;
    }

    try {
      await axios.post(`${API}/products`, {
        ...newProduct,
        price: newProduct.price ? parseFloat(newProduct.price) : null
      });
      toast.success('Produkt tilføjet!');
      setIsAddProductOpen(false);
      setNewProduct({
        brand_id: '',
        name: '',
        category_key: '',
        product_url: '',
        price: '',
        size: '',
        image_url: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Kunne ikke tilføje produkt');
    }
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/admin/import-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setCsvPreview(response.data);
      toast.success(`${response.data.count} opskrifter klar til import`);
    } catch (error) {
      console.error('CSV parse error:', error);
      toast.error('Kunne ikke læse CSV fil: ' + (error.response?.data?.detail || error.message));
      setCsvFile(null);
    } finally {
      setImporting(false);
    }
  };

  const confirmImport = async () => {
    if (!csvPreview || !csvPreview.recipes) return;

    setImporting(true);
    try {
      const response = await axios.post(`${API}/admin/confirm-import`, csvPreview.recipes);
      
      toast.success(`✅ ${response.data.count} opskrifter importeret!`);
      setIsImportOpen(false);
      setCsvFile(null);
      setCsvPreview(null);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import fejlede: ' + (error.response?.data?.detail || error.message));
    } finally {
      setImporting(false);
    }
  };

  const commonCategories = [
    'sirup.baer.jordbaer',
    'sirup.citrus.citron',
    'sirup.blue',
    'sirup.cola',
    'sirup.citrus.appelsin',
    'sirup.baer.hindbaer',
    'sirup.aeble',
    'sirup.fersken',
    'sirup.mango',
    'sirup.kokos',
    'base.vand',
    'alkohol.rom',
    'alkohol.vodka',
    'alkohol.tequila'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in" data-testid="admin-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Admin - Leverandører</h1>
        <p className="text-gray-600">Administrer brands og produkter</p>
      </div>

      {/* Brands Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Brands</h2>
          <Dialog open={isAddBrandOpen} onOpenChange={setIsAddBrandOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-brand-button">
                <FaPlus className="mr-2" /> Tilføj Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tilføj Nyt Brand</DialogTitle>
              </DialogHeader>
              <form onSubmit={addBrand} className="space-y-4">
                <div>
                  <Label>Brand Navn *</Label>
                  <Input
                    data-testid="brand-name-input"
                    value={newBrand.name}
                    onChange={(e) => setNewBrand({...newBrand, name: e.target.value})}
                    placeholder="fx Linds"
                  />
                </div>
                <div>
                  <Label>Hjemmeside *</Label>
                  <Input
                    data-testid="brand-website-input"
                    value={newBrand.website}
                    onChange={(e) => setNewBrand({...newBrand, website: e.target.value})}
                    placeholder="https://www.linds.dk"
                  />
                </div>
                <div>
                  <Label>Logo URL (valgfri)</Label>
                  <Input
                    value={newBrand.logo_url}
                    onChange={(e) => setNewBrand({...newBrand, logo_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="submit-brand">
                  Tilføj Brand
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="loading-spinner"></div>
          </div>
        ) : brands.length === 0 ? (
          <p className="text-gray-600">Ingen brands endnu</p>
        ) : (
          <div className="space-y-3">
            {brands.map((brand) => (
              <div
                key={brand.id}
                data-testid={`brand-${brand.id}`}
                className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-lg">{brand.name}</h3>
                  <p className="text-sm text-gray-600">{brand.website}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Produkter</h2>
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-product-button" disabled={brands.length === 0}>
                <FaPlus className="mr-2" /> Tilføj Produkt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tilføj Nyt Produkt</DialogTitle>
              </DialogHeader>
              <form onSubmit={addProduct} className="space-y-4">
                <div>
                  <Label>Brand *</Label>
                  <select
                    value={newProduct.brand_id}
                    onChange={(e) => setNewProduct({...newProduct, brand_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  >
                    <option value="">Vælg brand...</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Produkt Navn *</Label>
                  <Input
                    data-testid="product-name-input"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="fx Linds Jordbær Sirup 5L"
                  />
                </div>
                <div>
                  <Label>Kategori Nøgle *</Label>
                  <select
                    value={newProduct.category_key}
                    onChange={(e) => setNewProduct({...newProduct, category_key: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md mb-2"
                  >
                    <option value="">Vælg kategori...</option>
                    {commonCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Eller skriv egen kategori..."
                    value={newProduct.category_key}
                    onChange={(e) => setNewProduct({...newProduct, category_key: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Bruges til at matche med ingredienser
                  </p>
                </div>
                <div>
                  <Label>Produkt URL (link til køb) *</Label>
                  <Input
                    data-testid="product-url-input"
                    value={newProduct.product_url}
                    onChange={(e) => setNewProduct({...newProduct, product_url: e.target.value})}
                    placeholder="https://www.linds.dk/produkt..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pris (kr)</Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      placeholder="99.00"
                    />
                  </div>
                  <div>
                    <Label>Størrelse</Label>
                    <Input
                      value={newProduct.size}
                      onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
                      placeholder="5L"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" data-testid="submit-product">
                  Tilføj Produkt
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="loading-spinner"></div>
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-600">Ingen produkter endnu</p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                data-testid={`product-${product.id}`}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="text-sm text-gray-600">
                      Brand: {product.brand?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Kategori: {product.category_key}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">
                      <FaEye className="inline mr-1" />
                      {product.click_count} klik
                    </p>
                    {product.price && (
                      <p className="text-sm text-gray-600">{product.price} kr</p>
                    )}
                  </div>
                </div>
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-600 hover:underline"
                >
                  {product.product_url}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
