import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const AddRecipePage = ({ sessionId }) => {
  const navigate = useNavigate();
  const [canAdd, setCanAdd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState({
    name: '',
    description: '',
    color: 'red',
    type: 'klassisk',
    alcohol_flag: false,
    base_volume_ml: 2700,
    target_brix: 14,
    tags: [],
    ingredients: [
      { name: '', category_key: '', quantity: 0, unit: 'ml', role: 'required', brix: null }
    ],
    steps: [''],
    image_url: '/api/images/placeholder.jpg'
  });
  const [tagInput, setTagInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    checkLimits();
  }, [sessionId]);

  const checkLimits = async () => {
    try {
      const response = await axios.get(`${API}/user/${sessionId}/limits`);
      setCanAdd(response.data.can_add_recipe);
      if (!response.data.can_add_recipe) {
        toast.error('Gratis limit nået! Maks 2 egne opskrifter.');
      }
    } catch (error) {
      console.error('Error checking limits:', error);
    }
  };

  const addIngredient = () => {
    setRecipe({
      ...recipe,
      ingredients: [
        { name: '', category_key: '', quantity: '', unit: 'ml', role: 'required', brix: null },
        ...recipe.ingredients
      ]
    });
    // Scroll to top of ingredients section
    setTimeout(() => {
      const ingredientsSection = document.querySelector('.ingredients-section');
      if (ingredientsSection) {
        ingredientsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index][field] = value;
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const removeIngredient = (index) => {
    if (recipe.ingredients.length === 1) {
      toast.error('Du skal have mindst 1 ingrediens');
      return;
    }
    setRecipe({
      ...recipe,
      ingredients: recipe.ingredients.filter((_, i) => i !== index)
    });
  };

  const addStep = () => {
    setRecipe({ ...recipe, steps: [...recipe.steps, ''] });
  };

  const updateStep = (index, value) => {
    const newSteps = [...recipe.steps];
    newSteps[index] = value;
    setRecipe({ ...recipe, steps: newSteps });
  };

  const removeStep = (index) => {
    if (recipe.steps.length === 1) {
      toast.error('Du skal have mindst 1 trin');
      return;
    }
    setRecipe({ ...recipe, steps: recipe.steps.filter((_, i) => i !== index) });
  };

  const addTag = () => {
    if (tagInput.trim() && !recipe.tags.includes(tagInput.trim())) {
      setRecipe({ ...recipe, tags: [...recipe.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setRecipe({ ...recipe, tags: recipe.tags.filter(t => t !== tag) });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        toast.error('Billede må maks være 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return recipe.image_url;
    
    const formData = new FormData();
    formData.append('file', imageFile);
    
    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.image_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Kunne ikke uploade billede');
      return recipe.image_url;
    }
  };

  const submitRecipe = async (e) => {
    e.preventDefault();
    
    if (!recipe.name || !recipe.description) {
      toast.error('Udfyld navn og beskrivelse');
      return;
    }

    if (recipe.ingredients.some(ing => !ing.name || !ing.category_key)) {
      toast.error('Alle ingredienser skal have navn og kategori');
      return;
    }

    if (recipe.steps.some(step => !step.trim())) {
      toast.error('Alle trin skal udfyldes');
      return;
    }

    setLoading(true);
    try {
      // Upload image first if exists
      const imageUrl = await uploadImage();
      
      const response = await axios.post(`${API}/recipes`, {
        session_id: sessionId,
        ...recipe,
        image_url: imageUrl,
        target_brix: parseFloat(recipe.target_brix),
        ingredients: recipe.ingredients.map(ing => ({
          ...ing,
          quantity: parseFloat(ing.quantity),
          brix: ing.brix ? parseFloat(ing.brix) : null
        }))
      });
      toast.success('Opskrift oprettet!');
      navigate(`/recipe/${response.data.id}`);
    } catch (error) {
      console.error('Error creating recipe:', error);
      if (error.response?.status === 403) {
        toast.error('Gratis limit nået! Maks 2 egne opskrifter.');
      } else {
        toast.error('Kunne ikke oprette opskrift');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!canAdd) {
    return (
      <div className="max-w-2xl mx-auto fade-in">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Gratis Limit Nået</h2>
          <p className="text-gray-700 mb-4">
            Du har allerede oprettet 2 opskrifter (gratis limit). Opgradér til Pro for ubegrænset adgang!
          </p>
          <Button onClick={() => navigate('/settings')}>Gå til Indstillinger</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in" data-testid="add-recipe-page">
      <button
        onClick={() => navigate(-1)}
        data-testid="back-button"
        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold"
      >
        <FaArrowLeft /> Tilbage
      </button>

      <div>
        <h1 className="text-4xl font-bold mb-2">Tilføj Opskrift</h1>
        <p className="text-gray-600">Opret din egen slushice opskrift</p>
      </div>

      <form onSubmit={submitRecipe} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold">Basis Information</h2>
          
          {/* Image Upload */}
          <div>
            <Label>Billede</Label>
            <div className="mt-2 space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FaPlus className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-600 mb-2">Upload billede</p>
                  <p className="text-xs text-gray-500">Maks 5MB - JPG, PNG</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
            </div>
          </div>
          
          <div>
            <Label>Navn *</Label>
            <Input
              data-testid="recipe-name-input"
              value={recipe.name}
              onChange={(e) => setRecipe({...recipe, name: e.target.value})}
              placeholder="fx Min Specielle Jordbær Slush"
            />
          </div>

          <div>
            <Label>Beskrivelse *</Label>
            <Textarea
              data-testid="recipe-description-input"
              value={recipe.description}
              onChange={(e) => setRecipe({...recipe, description: e.target.value})}
              placeholder="Beskriv din opskrift..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Type/Gruppe *</Label>
              <select
                value={recipe.type}
                onChange={(e) => setRecipe({...recipe, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="klassisk">Klassisk</option>
                <option value="juice">Juice</option>
                <option value="smoothie">Smoothie</option>
                <option value="sodavand">Sodavand</option>
                <option value="cocktail">Cocktail</option>
                <option value="kaffe">Kaffe</option>
                <option value="sport">Sport</option>
                <option value="sukkerfri">Sukkerfri</option>
                <option value="maelk">Mælk</option>
              </select>
            </div>

            <div>
              <Label>Farve (valgfri)</Label>
              <select
                value={recipe.color}
                onChange={(e) => setRecipe({...recipe, color: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="red">Rød</option>
                <option value="blue">Blå</option>
                <option value="green">Grøn</option>
                <option value="yellow">Gul</option>
                <option value="orange">Orange</option>
                <option value="pink">Pink</option>
                <option value="purple">Lilla</option>
                <option value="brown">Brun</option>
              </select>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Sukkergrad (°Bx)
                <button
                  type="button"
                  className="text-cyan-600 hover:text-cyan-700"
                  title="Sukkergrad måler hvor meget sukker der er i blandingen. For perfekt slush: 13-15°Bx. For lidt = hård is. For meget = fryser ikke."
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </Label>
              <Input
                type="number"
                step="0.1"
                value={recipe.target_brix}
                onChange={(e) => setRecipe({...recipe, target_brix: e.target.value})}
                placeholder="13-15"
              />
              <p className="text-xs text-gray-500 mt-1">Anbefalet: 13-15°Bx</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Basis Volumen (ml)
                <button
                  type="button"
                  className="text-cyan-600 hover:text-cyan-700"
                  title="Hvor meget opskriften laver i basis. Standard er 2700ml. Kan senere skaleres til din maskine."
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </Label>
              <Input
                type="number"
                step="100"
                value={recipe.base_volume_ml}
                onChange={(e) => setRecipe({...recipe, base_volume_ml: parseInt(e.target.value)})}
                placeholder="2700"
              />
              <p className="text-xs text-gray-500 mt-1">Standard: 2700ml</p>
            </div>

            <div className="col-span-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={recipe.alcohol_flag}
                  onChange={(e) => setRecipe({...recipe, alcohol_flag: e.target.checked})}
                  className="w-4 h-4"
                />
                Indeholder alkohol (18+)
              </Label>
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Tilføj tag..."
              />
              <Button type="button" onClick={addTag}>
                Tilføj
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <FaTrash size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Ingredienser</h2>
            <Button type="button" onClick={addIngredient} size="sm">
              <FaPlus className="mr-2" /> Tilføj
            </Button>
          </div>

          {recipe.ingredients.map((ingredient, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Ingrediens {index + 1}</span>
                {recipe.ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Navn *"
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                />
                <Input
                  placeholder="Kategori * (fx sirup.baer)"
                  value={ingredient.category_key}
                  onChange={(e) => updateIngredient(index, 'category_key', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Mængde"
                  value={ingredient.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                />
                <select
                  value={ingredient.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-md"
                >
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="g">g</option>
                </select>
                <select
                  value={ingredient.role}
                  onChange={(e) => updateIngredient(index, 'role', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-md"
                >
                  <option value="required">Nødvendig</option>
                  <option value="optional">Valgfri</option>
                </select>
                <Input
                  type="number"
                  placeholder="Brix (valgfrit)"
                  value={ingredient.brix || ''}
                  onChange={(e) => updateIngredient(index, 'brix', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Fremgangsmåde</h2>
            <Button type="button" onClick={addStep} size="sm">
              <FaPlus className="mr-2" /> Tilføj Trin
            </Button>
          </div>

          {recipe.steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </span>
              <Textarea
                value={step}
                onChange={(e) => updateStep(index, e.target.value)}
                placeholder={`Trin ${index + 1}...`}
                rows={2}
                className="flex-1"
              />
              {recipe.steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Annullér
          </Button>
          <Button
            type="submit"
            disabled={loading}
            data-testid="submit-recipe"
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
          >
            {loading ? 'Opretter...' : 'Opret Opskrift'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddRecipePage;