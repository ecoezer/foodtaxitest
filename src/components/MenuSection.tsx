import React, { useState, useCallback, memo } from 'react';
import { Plus, Minus, ShoppingCart, ChefHat, Clock, Star, ArrowRight, Check } from 'lucide-react';
import { MenuItem, PizzaSize } from '../types';
import { 
  wunschPizzaIngredients, 
  pizzaExtras, 
  pizzaSpecialRequests,
  pastaTypes, 
  sauceTypes, 
  saladSauceTypes,
  beerTypes 
} from '../data/menuItems';

interface MenuSectionProps {
  title: string;
  description?: string;
  subTitle?: string;
  items: MenuItem[];
  bgColor?: string;
  onAddToOrder: (
    menuItem: MenuItem, 
    selectedSize?: PizzaSize, 
    selectedIngredients?: string[], 
    selectedExtras?: string[],
    selectedPastaType?: string,
    selectedSauce?: string,
    selectedSpecialRequest?: string
  ) => void;
}

interface ItemModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToOrder: (
    menuItem: MenuItem, 
    selectedSize?: PizzaSize, 
    selectedIngredients?: string[], 
    selectedExtras?: string[],
    selectedPastaType?: string,
    selectedSauce?: string,
    selectedSpecialRequest?: string
  ) => void;
}

const ItemModal: React.FC<ItemModalProps> = memo(({ item, isOpen, onClose, onAddToOrder }) => {
  const [selectedSize, setSelectedSize] = useState<PizzaSize | undefined>(
    item.sizes ? item.sizes[0] : undefined
  );
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedPastaType, setSelectedPastaType] = useState<string>('');
  const [selectedSauce, setSelectedSauce] = useState<string>('');
  const [selectedSpecialRequest, setSelectedSpecialRequest] = useState<string>('Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<'size' | 'specialRequest' | 'ingredients' | 'extras' | 'complete'>('size');

  // Get dynamic pricing for special requests based on pizza size
  const getSpecialRequestPrice = useCallback((requestName: string, size?: PizzaSize) => {
    if (requestName === 'Standard') return 0;
    
    const basePrices = {
      'Käserand': { medium: 2.00, large: 2.50, family: 3.00, mega: 3.00 },
      'Americanstyle': { medium: 1.50, large: 2.00, family: 2.50, mega: 2.50 },
      'als Calzone': { medium: 1.00, large: 1.50, family: 2.00, mega: 2.00 }
    };
    
    const sizeKey = size?.name.toLowerCase() || 'medium';
    return basePrices[requestName]?.[sizeKey] || 0;
  }, []);

  // Get dynamic special requests with current pricing
  const getDynamicSpecialRequests = useCallback(() => {
    return [
      { name: 'Standard', price: 0, description: 'Normale Pizza' },
      { 
        name: 'Käserand', 
        price: getSpecialRequestPrice('Käserand', selectedSize), 
        description: `Mit Käserand (+${getSpecialRequestPrice('Käserand', selectedSize).toFixed(2).replace('.', ',')}€)` 
      },
      { 
        name: 'Americanstyle', 
        price: getSpecialRequestPrice('Americanstyle', selectedSize), 
        description: `Amerikanischer Stil (+${getSpecialRequestPrice('Americanstyle', selectedSize).toFixed(2).replace('.', ',')}€)` 
      },
      { 
        name: 'als Calzone', 
        price: getSpecialRequestPrice('als Calzone', selectedSize), 
        description: `Als gefüllte Calzone (+${getSpecialRequestPrice('als Calzone', selectedSize).toFixed(2).replace('.', ',')}€)` 
      }
    ];
  }, [selectedSize, getSpecialRequestPrice]);

  const resetSelections = useCallback(() => {
    setSelectedSize(item.sizes ? item.sizes[0] : undefined);
    setSelectedIngredients([]);
    setSelectedExtras([]);
    setSelectedPastaType('');
    setSelectedSauce('');
    setSelectedSpecialRequest('Standard');
  }, [item]);

  React.useEffect(() => {
    if (isOpen) {
      resetSelections();
      setCurrentStep('size');
    }
  }, [isOpen, resetSelections]);

  const handleIngredientToggle = useCallback((ingredient: string) => {
    setSelectedIngredients(prev => {
      if (ingredient === 'ohne Zutat') {
        return prev.includes(ingredient) ? [] : [ingredient];
      }
      
      const filtered = prev.filter(ing => ing !== 'ohne Zutat');
      return filtered.includes(ingredient)
        ? filtered.filter(ing => ing !== ingredient)
        : [...filtered, ingredient];
    });
  }, []);

  const handleExtraToggle = useCallback((extra: string) => {
    setSelectedExtras(prev =>
      prev.includes(extra)
        ? prev.filter(e => e !== extra)
        : [...prev, extra]
    );
  }, []);

  const handleAddToOrder = useCallback(() => {
    // Add multiple items based on quantity
    for (let i = 0; i < quantity; i++) {
      onAddToOrder(item, selectedSize, selectedIngredients, selectedExtras, selectedPastaType, selectedSauce, selectedSpecialRequest);
    }
    onClose();
  }, [item, selectedSize, selectedIngredients, selectedExtras, selectedPastaType, selectedSauce, selectedSpecialRequest, quantity, onAddToOrder, onClose]);

  const handleSizeSelection = useCallback((size: PizzaSize) => {
    setSelectedSize(size);
  }, [item.isPizza, item.isWunschPizza]);

  const handleSpecialRequestSelection = useCallback((request: string) => {
    setSelectedSpecialRequest(request);
  }, []);

  const handleBackToSize = useCallback(() => {
    setCurrentStep('size');
  }, []);

  const getCurrentPrice = useCallback(() => {
    let price = selectedSize ? selectedSize.price : item.price;
    price += selectedExtras.length * 1.50;
    
    // Add special request price
    if (selectedSpecialRequest && selectedSpecialRequest !== 'Standard') {
      price += getSpecialRequestPrice(selectedSpecialRequest, selectedSize);
    }
    
    return price;
  }, [selectedSize, selectedExtras, selectedSpecialRequest, item.price, getSpecialRequestPrice]);

  const getTotalPrice = useCallback(() => {
    return getCurrentPrice() * quantity;
  }, [getCurrentPrice, quantity]);

  const canAddToOrder = useCallback(() => {
    // Check if pasta type is required and selected
    if (item.isPasta && !selectedPastaType) {
      return false;
    }
    
    // Check if sauce is required and selected
    const needsSauceSelection = (item.isSpezialitaet && ![81, 82].includes(item.id)) || 
                               (item.id >= 568 && item.id <= 573 && item.isSpezialitaet) ||
                               item.isBeerSelection;
    if (needsSauceSelection && !selectedSauce) {
      return false;
    }
    
    // Check Wunsch Pizza ingredients
    if (item.isWunschPizza) {
      const validIngredients = selectedIngredients.filter(ing => ing !== 'ohne Zutat');
      if (selectedIngredients.includes('ohne Zutat')) {
        return validIngredients.length === 0;
      }
      return validIngredients.length === 4;
    }
    
    return true;
  }, [item, selectedPastaType, selectedSauce, selectedIngredients]);

  if (!isOpen) return null;

  // For simple pizzas (not Wunsch Pizza), show simplified modal
  if (item.isPizza && !item.isWunschPizza && !item.isPasta && !item.isSpezialitaet && !item.isBeerSelection) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {item.name}
                </h3>
                <p className="text-gray-600 mt-2 text-sm">
                  ab {Math.min(...(item.sizes?.map(s => s.price) || [item.price])).toFixed(2).replace('.', ',')} €
                </p>
                {item.description && (
                  <p className="text-gray-600 mt-2 text-sm">{item.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{item.name}:</h4>
                  <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
                    1 Pflichtfeld
                  </span>
                </div>

                {/* Size Selection */}
                {item.sizes && item.sizes.length > 0 && (
                  <div className="space-y-2">
                    {item.sizes.map((size) => (
                      <label
                        key={size.name}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedSize?.name === size.name
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="size"
                            checked={selectedSize?.name === size.name}
                            onChange={() => handleSizeSelection(size)}
                            className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                          />
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{size.name}, {size.description}</div>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900">
                          {size.price.toFixed(2).replace('.', ',')} €
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="text-xl font-semibold text-gray-900 min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={handleAddToOrder}
                  disabled={!canAddToOrder()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    canAddToOrder()
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Hinzufügen</span>
                  <span className="font-bold">
                    {getTotalPrice().toFixed(2).replace('.', ',')} €
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wunsch Pizza size selection step
  if (item.isWunschPizza && currentStep === 'size') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {item.name}
                  <span className="text-sm text-gray-500 block">Schritt 1: Größe wählen</span>
                </h3>
                {item.description && (
                  <p className="text-gray-600 mt-2 text-sm">{item.description}</p>
                )}
              </div>
              <div className="text-right">
                {selectedSize ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-orange-600">
                      {getTotalPrice().toFixed(2).replace('.', ',')} €
                    </span>
                    <span className="text-xs text-gray-500">
                      {selectedSize.name} - {selectedSize.description} × {quantity}
                    </span>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-sm text-gray-500 block">ab</span>
                    <span className="text-xl font-bold text-orange-600">
                      {Math.min(...(item.sizes?.map(s => s.price) || [item.price])).toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{item.name}:</h4>
                  <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
                    1 Pflichtfeld
                  </span>
                </div>

                {/* Size Selection */}
                {item.sizes && item.sizes.length > 0 && (
                  <div className="space-y-2">
                    {item.sizes.map((size) => (
                      <label
                        key={size.name}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedSize?.name === size.name
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="size"
                            checked={selectedSize?.name === size.name}
                            onChange={() => setSelectedSize(size)}
                            className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                          />
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{size.name}, {size.description}</div>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900">
                          {size.price.toFixed(2).replace('.', ',')} €
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="text-xl font-semibold text-gray-900 min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (item.isPizza || item.isWunschPizza) {
                      setCurrentStep('specialRequest');
                    } else {
                      setCurrentStep('complete');
                    }
                  }}
                  disabled={!selectedSize}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedSize
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Weiter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Special request selection step for pizzas
  if ((item.isPizza || item.isWunschPizza) && currentStep === 'specialRequest') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {item.name}
                  <span className="text-sm text-gray-500 block">
                    Schritt 2: Dein Sonderwunsch
                  </span>
                </h3>
                <p className="text-gray-600 mt-2 text-sm">
                  Größe: {selectedSize?.name} {selectedSize?.description && `- ${selectedSize.description}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Dein Sonderwunsch:</h4>
                <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
                  1 Pflichtfeld
                </span>
              </div>

              <div className="space-y-2">
                {getDynamicSpecialRequests().map((request) => (
                  <label
                    key={request.name}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSpecialRequest === request.name
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="specialRequest"
                        checked={selectedSpecialRequest === request.name}
                        onChange={() => handleSpecialRequestSelection(request.name)}
                        className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{request.name}</div>
                        {request.description && (
                          <div className="text-sm text-gray-500">{request.description}</div>
                        )}
                      </div>
                    </div>
                    {request.price > 0 && (
                      <span className="font-bold text-gray-900">
                        +{request.price.toFixed(2).replace('.', ',')} €
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
              <button
                onClick={handleBackToSize}
                className="px-6 py-3 rounded-lg font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-all"
              >
                Zurück
              </button>

              <button
                onClick={() => setCurrentStep(item.isWunschPizza ? 'ingredients' : 'extras')}
                disabled={!selectedSpecialRequest}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedSpecialRequest
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>Weiter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ingredients selection step for Wunsch Pizza
  if (item.isWunschPizza && currentStep === 'ingredients') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {item.name}
                  <span className="text-sm text-gray-500 block">Schritt 3: 4 Zutaten wählen:</span>
                </h3>
                <p className="text-gray-600 mt-2 text-sm">
                  Größe: {selectedSize?.name} {selectedSize?.description && `- ${selectedSize.description}`}
                </p>
                {selectedSpecialRequest && selectedSpecialRequest !== 'Standard' && (
                  <p className="text-gray-600 mt-1 text-sm">
                    Sonderwunsch: {selectedSpecialRequest}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">4 Zutaten wählen:</h4>
                <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
                  1 Pflichtfeld
                </span>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto ingredients-scroll">
                {wunschPizzaIngredients.map((ingredient) => {
                  const isSelected = selectedIngredients.includes(ingredient.name);
                  const hasOhneZutat = selectedIngredients.includes('ohne Zutat');
                  const validIngredients = selectedIngredients.filter(ing => ing !== 'ohne Zutat');
                  const canSelect = ingredient.name === 'ohne Zutat' 
                    ? validIngredients.length === 0
                    : !hasOhneZutat && (isSelected || validIngredients.length < 4);
                  
                  return (
                    <label
                      key={ingredient.name}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : !canSelect
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleIngredientToggle(ingredient.name)}
                          disabled={!canSelect}
                          className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">{ingredient.name}</div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium">
                  Ausgewählt: {selectedIngredients.includes('ohne Zutat') ? '0 (ohne Zutat)' : `${selectedIngredients.length} / 4`}
                </p>
                {!selectedIngredients.includes('ohne Zutat') && selectedIngredients.length < 4 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Noch {4 - selectedIngredients.length} Zutat{4 - selectedIngredients.length !== 1 ? 'en' : ''} wählen
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
              <button
                onClick={() => setCurrentStep('specialRequest')}
                className="px-6 py-3 rounded-lg font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-all"
              >
                Zurück
              </button>

              <button
                onClick={() => setCurrentStep('extras')}
                disabled={!canAddToOrder()}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  canAddToOrder()
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>Weiter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extras selection step for pizzas
  if ((item.isPizza || item.isWunschPizza) && currentStep === 'extras') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {item.name}
                  <span className="text-sm text-gray-500 block">
                    {item.isWunschPizza ? 'Schritt 4: Extras hinzufügen:' : 'Extras hinzufügen:'}
                  </span>
                </h3>
                <p className="text-gray-600 mt-2 text-sm">
                  Größe: {selectedSize?.name} {selectedSize?.description && `- ${selectedSize.description}`}
                </p>
                {selectedSpecialRequest && selectedSpecialRequest !== 'Standard' && (
                  <p className="text-gray-600 mt-1 text-sm">
                    Sonderwunsch: {selectedSpecialRequest}
                  </p>
                )}
                {item.isWunschPizza && selectedIngredients && selectedIngredients.length > 0 && (
                  <p className="text-gray-600 mt-1 text-sm">
                    Zutaten: {selectedIngredients.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Extras hinzufügen:</h4>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                  Optional
                </span>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto ingredients-scroll">
                {pizzaExtras.map((extra) => (
                  <label
                    key={extra.name}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedExtras.includes(extra.name)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedExtras.includes(extra.name)}
                        onChange={() => handleExtraToggle(extra.name)}
                        className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{extra.name}</div>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">
                      +{extra.price.toFixed(2).replace('.', ',')} €
                    </span>
                  </label>
                ))}
              </div>
              
              {selectedExtras.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium">
                    Extras: +{(selectedExtras.length * 1.50).toFixed(2).replace('.', ',')} €
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
              <button
                onClick={() => setCurrentStep(item.isWunschPizza ? 'ingredients' : 'specialRequest')}
                className="px-6 py-3 rounded-lg font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-all"
              >
                Zurück
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="text-xl font-semibold text-gray-900 min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={handleAddToOrder}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all bg-orange-500 text-white hover:bg-orange-600"
                >
                  <span>Hinzufügen</span>
                  <span className="font-bold">
                    {getTotalPrice().toFixed(2).replace('.', ',')} €
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Original complex modal for Wunsch Pizza, Pasta, etc.
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {item.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto flex-1">
          </div>

          <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-all"
            >
              Abbrechen
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900 min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <button
                onClick={handleAddToOrder}
                disabled={!canAddToOrder()}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  canAddToOrder()
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>Hinzufügen</span>
                <span className="font-bold">
                  {getTotalPrice().toFixed(2).replace('.', ',')} €
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const MenuSection: React.FC<MenuSectionProps> = ({ title, description, subTitle, items, bgColor = 'bg-orange-500', onAddToOrder }) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleItemClick = useCallback((item: MenuItem) => {
    // Items that need configuration
    const needsConfiguration = item.sizes || 
                              item.isWunschPizza || 
                              item.isPizza || 
                              item.isPasta ||
                              item.isBeerSelection ||
                              (item.isSpezialitaet && ![81, 82].includes(item.id)) || // Exclude Gyros Hollandaise and Gyros Topf
                              (item.id >= 568 && item.id <= 573 && item.isSpezialitaet); // Salads

    if (needsConfiguration) {
      setSelectedItem(item);
    } else {
      onAddToOrder(item);
    }
  }, [onAddToOrder]);

  const closeModal = useCallback(() => {
    setSelectedItem(null);
  }, []);

  if (!items || items.length === 0) {
    return (
      <section className="mb-8">
        <div className="text-center py-8">
          <p className="text-gray-500">Keine Artikel in dieser Kategorie verfügbar.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className={`${bgColor} text-white p-3 sm:p-4 rounded-t-xl`}>
        <div className="flex items-center gap-2 mb-1">
          <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
          <h2 className="text-sm sm:text-sm md:text-base font-bold">{title}</h2>
        </div>
        {description && (
          <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{description}</p>
        )}
        {subTitle && (
          <p className="text-xs sm:text-sm opacity-80 mt-1 italic">{subTitle}</p>
        )}
      </div>

      <div className="bg-white rounded-b-xl shadow-lg overflow-hidden">
        <div className="divide-y divide-gray-200/60">
          {items.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="p-2 sm:p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-orange-50/30 transition-all duration-200 group relative"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm sm:text-base font-bold">
                      {item.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      {item.allergens && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Allergene:</span> {item.allergens}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    {item.sizes && item.sizes.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">ab</div>
                        <div className="text-base sm:text-lg font-bold text-orange-600">
                          {Math.min(...item.sizes.map(s => s.price)).toFixed(2).replace('.', ',')} €
                        </div>
                      </div>
                    ) : (
                      <div className="text-base sm:text-lg font-bold text-orange-600 relative">
                        {/* Show original price crossed out if there's a special offer */}
                        {((item.id === 84 && new Date().getDay() === 3) || 
                          ([547, 548].includes(item.id) && new Date().getDay() === 4)) && (
                          <div className="text-sm text-gray-500 line-through">
                            {item.id === 84 ? '14,90' : '12,90'} €
                          </div>
                        )}
                        <div className={((item.id === 84 && new Date().getDay() === 3) || 
                          ([547, 548].includes(item.id) && new Date().getDay() === 4)) 
                          ? 'text-red-600 font-extrabold animate-pulse' : ''}>
                          {item.price.toFixed(2).replace('.', ',')} €
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="flex items-center gap-1.5 bg-orange-500 text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-all transform hover:scale-105 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg"
                    onClick={() => handleItemClick(item)}
                  >
                    <Plus className="w-3 h-3" />
                    <span className="hidden sm:inline">Hinzufügen</span>
                  </button>
                </div>
              </div>

              {/* Configuration indicators */}
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                {/* Special offer indicators */}
                {item.id === 84 && new Date().getDay() === 3 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full animate-pulse">
                    🔥 RIPPCHEN-TAG SPEZIAL
                  </span>
                )}
                {[546, 547, 548, 549].includes(item.id) && new Date().getDay() === 4 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full animate-pulse">
                    🔥 SCHNITZEL-TAG SPEZIAL
                  </span>
                )}
                {item.sizes && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                    <Star className="w-3 h-3" />
                    Größen verfügbar
                  </span>
                )}
                {item.isWunschPizza && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                    <ChefHat className="w-3 h-3" />
                    4 Zutaten wählbar
                  </span>
                )}
                {(item.isPizza && !item.isWunschPizza) && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                    <Plus className="w-3 h-3" />
                    Extras verfügbar
                  </span>
                )}
                {item.isWunschPizza && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                    <Plus className="w-3 h-3" />
                    Extras verfügbar
                  </span>
                )}
                {item.isPasta && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    <Clock className="w-3 h-3" />
                    Nudelsorte wählbar
                  </span>
                )}
                {item.isSpezialitaet && ![81, 82].includes(item.id) && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                    <ChefHat className="w-3 h-3" />
                    Soße wählbar
                  </span>
                )}
                {item.id >= 568 && item.id <= 573 && item.isSpezialitaet && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                    <ChefHat className="w-3 h-3" />
                    Dressing wählbar
                  </span>
                )}
                {item.isBeerSelection && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                    <ChefHat className="w-3 h-3" />
                    Bier wählbar
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={closeModal}
          onAddToOrder={onAddToOrder}
        />
      )}
    </section>
  );
};

export default MenuSection;