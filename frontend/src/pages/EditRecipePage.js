import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaArrowLeft, FaPlus, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { normalizeIngredient, getSupportedUnits, denormalizeIngredient } from '../utils/unitConverter';

const EditRecipePage = ({ sessionId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageRightsConfirmed, setImageRightsConfirmed] = useState(false);
  const [showVolumeInfo, setShowVolumeInfo] = useState(false);
  const [showBrixInfo, setShowBrixInfo] = useState(false);
  const [supportedUnits, setSupportedUnits] = useState(['ml', 'dl', 'l']);

  useEffect(() => {
    fetchRecipe();
    fetchSupportedUnits();
  }, [id, sessionId]);

  const fetchSupportedUnits = async () => {
    try {
      const lang = i18n.language || 'da';
      const response = await axios.get(`${API}/units/supported?language=${lang}`);
      setSupportedUnits(response.data.units);
    } catch (error) {
      console.error('Could not fetch supported units:', error);
      setSupportedUnits(['ml', 'dl', 'l']);
    }
  };

  const fetchRecipe = async () => {
    try {
      const response = await axios.get(`${API}/recipes/${id}?session_id=${sessionId}&lang=da`);
      
      // Denormalize ingredients for display (convert from ml back to display unit)
      const denormalizedRecipe = {
        ...response.data,
        ingredients: response.data.ingredients.map(ing => {
          // If ingredient has quantity_ml, use denormalize
          if (ing.quantity_ml) {
            return denormalizeIngredient(ing);
          }
          // Otherwise keep as-is (old format)
          return ing;
        })
      };
      
      setRecipe(denormalizedRecipe);
      setImagePreview(denormalizedRecipe.image_url);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error(t('addRecipe.fetchError', 'Kunne ikke hente opskrift'));
      navigate('/recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error(t('addRecipe.imageSizeError', 'Billede må maks være 5MB'));
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

  const addIngredient = () => {
    setRecipe({
      ...recipe,
      ingredients: [
        ...recipe.ingredients,
        { name: '', category_key: '', quantity: '', unit: 'ml', role: 'required', brix: null }
      ]
    });
    setTimeout(() => {
      const ingredientsSection = document.querySelector('.ingredients-section');
      if (ingredientsSection) {
        const lastIngredient = ingredientsSection.querySelector('.ingredient-item:last-child');
        if (lastIngredient) {
          lastIngredient.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
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

  const moveIngredientUp = (index) => {
    if (index === 0) return;
    const newIngredients = [...recipe.ingredients];
    [newIngredients[index - 1], newIngredients[index]] = [newIngredients[index], newIngredients[index - 1]];
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const moveIngredientDown = (index) => {
    if (index === recipe.ingredients.length - 1) return;
    const newIngredients = [...recipe.ingredients];
    [newIngredients[index], newIngredients[index + 1]] = [newIngredients[index + 1], newIngredients[index]];
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const addStep = () => {
    setRecipe({ ...recipe, steps: [...recipe.steps, ''] });
    setTimeout(() => {
      const stepsSection = document.querySelector('.steps-section');
      if (stepsSection) {
        const lastStep = stepsSection.querySelector('textarea:last-of-type');
        if (lastStep) {
          lastStep.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          lastStep.focus();
        }
      }
    }, 100);
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

  const moveStepUp = (index) => {
    if (index === 0) return;
    const newSteps = [...recipe.steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    setRecipe({ ...recipe, steps: newSteps });
  };

  const moveStepDown = (index) => {
    if (index === recipe.steps.length - 1) return;
    const newSteps = [...recipe.steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    setRecipe({ ...recipe, steps: newSteps });
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

  const submitRecipe = async (e) => {
    e.preventDefault();
    
    if (!recipe.name || !recipe.description) {
      toast.error('Udfyld navn og beskrivelse');
      return;
    }

    if (!recipe.base_volume_ml || recipe.base_volume_ml <= 0) {
      toast.error('Basis volumen er obligatorisk og skal være større end 0');
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

    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      
      // Normalize ingredients to ml before sending to backend
      const normalizedIngredients = recipe.ingredients.map(ing => {
        const normalized = normalizeIngredient({
          ...ing,
          quantity: parseFloat(ing.quantity),
          brix: ing.brix ? parseFloat(ing.brix) : null
        });
        return normalized;
      });

      await axios.put(`${API}/recipes/${id}`, {
        session_id: sessionId,
        ...recipe,
        image_url: imageUrl,
        target_brix: parseFloat(recipe.target_brix),
        ingredients: normalizedIngredients
      });
      toast.success(t('messages.success.updated'));
      navigate(`/recipes/${id}`);
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast.error(t('addRecipe.updateError', 'Kunne ikke opdatere opskrift'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in" data-testid="edit-recipe-page">
      <button
        onClick={() => navigate(-1)}
        data-testid="back-button"
        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold"
      >
        <FaArrowLeft /> {t('common.back')}
      </button>

      <div>
        <h1 className="text-4xl font-bold mb-2">{t('addRecipe.editTitle')}</h1>
        <p className="text-gray-600">{recipe.name}</p>
      </div>

      <form onSubmit={submitRecipe} className="space-y-6">
        {/* Image */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold">Billede</h2>
          
          <div className="space-y-3">
            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                {imageFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(recipe.image_url);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <FaTrash size={12} />
                  </button>
                )}
              </div>
            )}
            <div>
              <Label>Skift Billede</Label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Maks 5MB - JPG, PNG</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold">Basis Information</h2>
          
          <div>
            <Label>Navn *</Label>
            <Input
              value={recipe.name}
              onChange={(e) => setRecipe({...recipe, name: e.target.value})}
              placeholder="fx Min Specielle Jordbær Slush"
            />
          </div>

          <div>
            <Label>Beskrivelse *</Label>
            <Textarea
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
                value={recipe.type || 'klassisk'}
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
              <Label className="flex items-center gap-2">
                Sukkergrad (°Bx)
                <button
                  type="button"
                  onClick={() => setShowBrixInfo(!showBrixInfo)}
                  className="text-cyan-600 hover:text-cyan-700 transition-colors"
                  title="Klik for mere information"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
              {showBrixInfo && (
                <div className="text-sm mt-2 bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-cyan-500 p-3 rounded-r animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="font-semibold text-cyan-900 mb-1 flex items-center gap-2">
                    <span className="text-lg">ℹ️</span>
                    <span>Sukkerindhold</span>
                  </p>
                  <p className="text-gray-700 text-xs leading-relaxed">
                    Brix måler sukkerindholdet i din opskrift.<br/>
                    <span className="text-gray-600">Anbefalet: 13-15°Bx for god konsistens.</span><br/>
                    <a href="/brix-info" className="text-cyan-600 underline mt-1 inline-block" target="_blank">Læs mere om Brix →</a>
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Basis Volumen (ml) <span className="text-red-500">*</span>
                <button
                  type="button"
                  onClick={() => setShowVolumeInfo(!showVolumeInfo)}
                  className="text-cyan-600 hover:text-cyan-700 transition-colors"
                  title="Klik for mere information"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </Label>
              <Input
                type="number"
                step="100"
                required
                value={recipe.base_volume_ml || 2700}
                onChange={(e) => setRecipe({...recipe, base_volume_ml: parseInt(e.target.value)})}
                placeholder="2700"
              />
              {showVolumeInfo && (
                <div className="text-sm mt-2 bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-cyan-500 p-3 rounded-r animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="font-semibold text-cyan-900 mb-1 flex items-center gap-2">
                    <span className="text-lg">ℹ️</span>
                    <span>{t('addRecipe.requiredField')}</span>
                  </p>
                  <p className="text-gray-700 text-xs leading-relaxed">
                    {t('addRecipe.volumeDescription')}<br/>
                    <span className="text-gray-600">{t('addRecipe.volumeExample')}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="col-span-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={recipe.alcohol_flag}
                  onChange={(e) => setRecipe({...recipe, alcohol_flag: e.target.checked})}
                  className="w-4 h-4"
                />
                {t('addRecipe.containsAlcohol')}
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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 ingredients-section">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Ingredienser</h2>
            <Button type="button" onClick={addIngredient} size="sm">
              <FaPlus className="mr-2" /> Tilføj
            </Button>
          </div>

          {recipe.ingredients.map((ingredient, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3 ingredient-item">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Ingrediens {index + 1}</span>
                <div className="flex items-center gap-2">
                  {/* Move up button */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveIngredientUp(index)}
                      className="text-cyan-500 hover:text-cyan-700 p-1"
                      title="Flyt op"
                    >
                      <FaArrowUp size={14} />
                    </button>
                  )}
                  {/* Move down button */}
                  {index < recipe.ingredients.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveIngredientDown(index)}
                      className="text-cyan-500 hover:text-cyan-700 p-1"
                      title="Flyt ned"
                    >
                      <FaArrowDown size={14} />
                    </button>
                  )}
                  {/* Delete button */}
                  {recipe.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Navn *"
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                />
                <Input
                  placeholder="Kategori *"
                  value={ingredient.category_key}
                  onChange={(e) => updateIngredient(index, 'category_key', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Mængde"
                  value={ingredient.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
                <select
                  value={ingredient.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-md"
                >
                  {supportedUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
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
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 steps-section">
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
              <div className="flex flex-col gap-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveStepUp(index)}
                    className="text-cyan-500 hover:text-cyan-700 p-1"
                    title="Flyt op"
                  >
                    <FaArrowUp size={14} />
                  </button>
                )}
                {index < recipe.steps.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveStepDown(index)}
                    className="text-cyan-500 hover:text-cyan-700 p-1"
                    title="Flyt ned"
                  >
                    <FaArrowDown size={14} />
                  </button>
                )}
              </div>
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

        {/* Publish Toggle */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {recipe.is_published ? '🌍 Offentlig opskrift' : '🔒 Privat opskrift'}
              </h3>
              <p className="text-sm text-gray-600">
                {recipe.is_published 
                  ? 'Denne opskrift er synlig for alle brugere' 
                  : 'Kun du kan se denne opskrift'}
              </p>
              {/* Show info if approved and user is not admin */}
              {recipe.status === 'approved' && !isAdmin() && (
                <p className="text-xs text-blue-600 mt-1">
                  ℹ️ Denne opskrift er godkendt. Ændringer kræver ny godkendelse.
                </p>
              )}
              {/* Show info if approved and user is not admin */}
              {recipe.status === 'approved' && !isAdmin() && (
                <p className="text-xs text-blue-600 mt-1">
                  ℹ️ Denne opskrift er godkendt. Ændringer kræver ny godkendelse.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                // Everyone (including admin) can toggle their own recipes
                const newPublishedState = !recipe.is_published;
                setRecipe({...recipe, is_published: newPublishedState});
                // Reset confirmation when toggling off
                if (!newPublishedState) {
                  setImageRightsConfirmed(false);
                }
              }}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                recipe.is_published ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  recipe.is_published ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Copyright Confirmation ONLY if image is uploaded */}
          {recipe.is_published && imageFile && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800 mb-2">
                  ⚠️ <strong>Vigtigt om billede:</strong> Du har uploadet et billede til denne opskrift.
                </p>
                <p className="text-xs text-amber-700">
                  Sørg for at du har rettighederne til billedet før du deler opskriften offentligt.
                </p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={imageRightsConfirmed}
                  onChange={(e) => setImageRightsConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">
                  Jeg bekræfter at jeg har rettighederne til det uploadede billede. 
                  <span className="text-red-600">*</span>
                </span>
              </label>
            </div>
          )}
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
            disabled={saving || (recipe.is_published && imageFile && !imageRightsConfirmed)}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
          >
            {saving ? t('addRecipe.saving') : t('addRecipe.saveChanges', 'Gem Ændringer')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditRecipePage;
