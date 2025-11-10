import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FaPlus, FaTrash, FaEye, FaUpload, FaFileImport, FaDownload } from 'react-icons/fa';
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
        <h1 className="text-4xl font-bold mb-2">Admin panel</h1>
        <p className="text-gray-600">Administrer opskrifter, brands og produkter</p>
      </div>

      {/* CSV Import Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
              <FaFileImport className="text-purple-600" />
              Importer Opskrifter fra CSV
            </h2>
            <p className="text-purple-700 text-sm mt-1">
              Upload en CSV fil for at importere opskrifter automatisk
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportRecipes}
              className="bg-green-600 hover:bg-green-700"
            >
              <FaDownload className="mr-2" /> Eksporter CSV
            </Button>
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <FaUpload className="mr-2" /> Importer fra CSV
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Importer Opskrifter fra CSV</DialogTitle>
              </DialogHeader>
              
              {!csvPreview ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Vælg CSV fil
                      </span>
                      <span className="text-gray-600"> eller træk og slip her</span>
                    </Label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <h3 className="font-bold mb-2">CSV Format:</h3>
                    <code className="text-xs block bg-white p-2 rounded">
                      Navn,Beskrivelse,Type,Farve,Brix,Volumen,Alkohol,Tags,Ingredienser,Fremgangsmåde
                    </code>
                    <p className="mt-2 text-gray-600">
                      <strong>Ingredienser:</strong> Navn:Mængde:Enhed:Brix:Rolle (adskilt med ;)<br/>
                      <strong>Fremgangsmåde:</strong> Step 1|Step 2|Step 3
                    </p>
                  </div>
                  
                  {importing && <p className="text-center text-gray-600">Parser CSV...</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      ✅ {csvPreview.count} opskrifter klar til import
                    </p>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {csvPreview.recipes.map((recipe, idx) => (
                      <div key={idx} className="bg-white border rounded-lg p-4">
                        <h3 className="font-bold text-lg">{recipe.name}</h3>
                        <p className="text-sm text-gray-600">{recipe.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {recipe.type}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {recipe.base_volume_ml}ml
                          </span>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                            {recipe.target_brix}°Bx
                          </span>
                          {recipe.alcohol_flag && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                              Alkohol
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {recipe.ingredients.length} ingredienser, {recipe.steps.length} trin
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={confirmImport}
                      disabled={importing}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {importing ? 'Importerer...' : '✓ Bekræft Import'}
                    </Button>
                    <Button
                      onClick={() => {
                        setCsvPreview(null);
                        setCsvFile(null);
                      }}
                      variant="outline"
                      className="flex-1"
                      disabled={importing}
                    >
                      Annuller
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-2">Leverandører & Produkter</h2>
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
