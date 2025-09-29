import React, { useState, memo, useCallback, useMemo } from 'react';
import { Plus, X, ShoppingCart } from 'lucide-react';
import { MenuItem, PizzaSize } from '../types';
import { pizzaExtras, pizzaSpecialRequests, pastaTypes, sauceTypes, saladSauceTypes, beerTypes } from '../data/menuItems';

interface MenuSectionProps {
  title: string;
  description?: string;
  subTitle?: string;
  items: MenuItem[];
  bgColor: string;
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

  const resetSelections = useCallback(() => {
    setSelectedSize(item.sizes ? item.sizes[0] : undefined);
    setSelectedIngredients([]);
    setSelectedExtras([]);
    setSelectedPastaType('');
    setSelectedSauce('');
    setSelectedSpecialRequest('Standard');
  }, [item.sizes]);

  const handleClose = useCallback(() => {
    resetSelections();
    onClose();
  }, [resetSelections, onClose]);

  const calculatePrice = useMemo(() => {
    let basePrice = selectedSize ? selectedSize.price : item.price;
    const extrasPrice = selectedExtras.length * 1.50;
    
    let specialRequestPrice = 0;
    if (selectedSpecialRequest && selectedSpecialRequest !== 'Standard') {
      const specialRequest = pizzaSpecialRequests.find(req => req.name === selectedSpecialRequest);
      if (specialRequest) {
        specialRequestPrice = specialRequest.price;
      }
    }
    
    return basePrice + extrasPrice + specialRequestPrice;
  }, [selectedSize, item.price, selectedExtras.length, selectedSpecialRequest]);

  const handleAddToOrder = useCallback(() => {
    onAddToOrder(
      item,
      selectedSize,
      selectedIngredients,
      selectedExtras,
      selectedPastaType || undefined,
      selectedSauce || undefined,
      selectedSpecialRequest
    );
    handleClose();
  }, [
    item,
    selectedSize,
    selectedIngredients,
    selectedExtras,
    selectedPastaType,
    selectedSauce,
    selectedSpecialRequest,
    onAddToOrder,
    handleClose
  ]);

  const toggleIngredient = useCallback((ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  }, []);

  const toggleExtra = useCallback((extra: string) => {
    setSelectedExtras(prev => 
      prev.includes(extra)
        ? prev.filter(e => e !== extra)
        : [...prev, extra]
    );
  }, []);

  if (!isOpen) return null;

  // Determine if this is a burger item
  const isBurger = item.name.toLowerCase().includes('burger');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold truncate">{item.name}</h3>
            {item.description && (
              <p className="text-sm sm:text-base opacity-90 mt-1 line-clamp-2">{item.description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="ml-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors flex-shrink-0"
            aria-label="Schließen"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Size Selection for items with sizes */}
            {item.sizes && item.sizes.length > 0 && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  {isBurger ? 'Patty-Größe wählen *' : 'Größe wählen *'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.sizes.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                        selectedSize?.name === size.name
                          ? 'border-orange-500 bg-orange-50 text-orange-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base">{size.name}</div>
                          {size.description && (
                            <div className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                              {size.description}
                            </div>
                          )}
                        </div>
                        <div className="ml-2 font-bold text-sm sm:text-base text-orange-600 flex-shrink-0">
                          {size.price.toFixed(2).replace('.', ',')} €
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wunsch Pizza Ingredients Selection */}
            {item.isWunschPizza && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  4 Zutaten wählen * (aktuell: {selectedIngredients.length}/4)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto ingredients-scroll">
                  {[
                    'Ananas', 'Artischocken', 'Barbecuesauce', 'Brokkoli', 'Champignons frisch',
                    'Chili-Cheese-Soße', 'Edamer', 'Formfleisch-Vorderschinken', 'Gewürzgurken',
                    'Gorgonzola', 'Gyros', 'Hirtenkäse', 'Hähnchenbrust', 'Jalapeños',
                    'Knoblauchwurst', 'Mais', 'Milde Peperoni', 'Mozzarella', 'Oliven',
                    'Paprika', 'Parmaschinken', 'Peperoni, scharf', 'Remoulade', 'Rindermett',
                    'Rindersalami', 'Rucola', 'Röstzwiebeln', 'Sauce Hollandaise', 'Spiegelei',
                    'Spinat', 'Tomaten', 'Würstchen', 'Zwiebeln', 'ohne Zutat'
                  ].map((ingredient) => (
                    <button
                      key={ingredient}
                      onClick={() => toggleIngredient(ingredient)}
                      disabled={!selectedIngredients.includes(ingredient) && selectedIngredients.length >= 4}
                      className={`p-2 sm:p-3 rounded-lg border text-xs sm:text-sm transition-all text-center ${
                        selectedIngredients.includes(ingredient)
                          ? 'border-green-500 bg-green-50 text-green-900 font-medium'
                          : selectedIngredients.length >= 4
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="break-words leading-tight">{ingredient}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pizza Extras Selection */}
            {(item.isPizza || item.isWunschPizza) && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Extras hinzufügen (je +1,50€)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto ingredients-scroll">
                  {pizzaExtras.map((extra) => (
                    <button
                      key={extra.name}
                      onClick={() => toggleExtra(extra.name)}
                      className={`p-2 sm:p-3 rounded-lg border text-xs sm:text-sm transition-all text-center ${
                        selectedExtras.includes(extra.name)
                          ? 'border-blue-500 bg-blue-50 text-blue-900 font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="break-words leading-tight">{extra.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pizza Special Requests */}
            {(item.isPizza || item.isWunschPizza) && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Sonderwunsch
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pizzaSpecialRequests.map((request) => (
                    <button
                      key={request.name}
                      onClick={() => setSelectedSpecialRequest(request.name)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                        selectedSpecialRequest === request.name
                          ? 'border-purple-500 bg-purple-50 text-purple-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base">{request.name}</div>
                          {request.description && (
                            <div className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                              {request.description}
                            </div>
                          )}
                        </div>
                        {request.price > 0 && (
                          <div className="ml-2 font-bold text-sm sm:text-base text-purple-600 flex-shrink-0">
                            +{request.price.toFixed(2).replace('.', ',')} €
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pasta Type Selection */}
            {item.isPasta && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Nudelsorte wählen *
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pastaTypes.map((pastaType) => (
                    <button
                      key={pastaType.name}
                      onClick={() => setSelectedPastaType(pastaType.name)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-center ${
                        selectedPastaType === pastaType.name
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-900 font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{pastaType.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sauce Selection for Spezialitäten */}
            {item.isSpezialitaet && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Soße wählen *
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sauceTypes.map((sauce) => (
                    <button
                      key={sauce.name}
                      onClick={() => setSelectedSauce(sauce.name)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-center ${
                        selectedSauce === sauce.name
                          ? 'border-red-500 bg-red-50 text-red-900 font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{sauce.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sauce Selection for Salads */}
            {item.name.toLowerCase().includes('salat') && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Dressing wählen *
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {saladSauceTypes.map((sauce) => (
                    <button
                      key={sauce.name}
                      onClick={() => setSelectedSauce(sauce.name)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-center ${
                        selectedSauce === sauce.name
                          ? 'border-green-500 bg-green-50 text-green-900 font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-sm sm:text-base break-words">{sauce.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Beer Selection */}
            {item.isBeerSelection && (
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Biersorte wählen *
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {beerTypes.map((beer) => (
                    <button
                      key={beer.name}
                      onClick={() => setSelectedSauce(beer.name)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-center ${
                        selectedSauce === beer.name
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{beer.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base sm:text-lg font-semibold text-gray-900">Gesamtpreis:</span>
            <span className="text-lg sm:text-xl font-bold text-orange-600">
              {calculatePrice.toFixed(2).replace('.', ',')} €
            </span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAddToOrder}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const MenuSection: React.FC<MenuSectionProps> = memo(({ title, description, subTitle, items, bgColor, onAddToOrder }) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleItemClick = useCallback((item: MenuItem) => {
    // Check if item needs customization
    const needsCustomization = 
      (item.sizes && item.sizes.length > 0) ||
      item.isWunschPizza ||
      item.isPizza ||
      item.isPasta ||
      item.isSpezialitaet ||
      item.isBeerSelection ||
      item.name.toLowerCase().includes('salat');

    if (needsCustomization) {
      setSelectedItem(item);
    } else {
      // Add directly to cart for simple items
      onAddToOrder(item);
    }
  }, [onAddToOrder]);

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
  }, []);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 sm:mb-12">
      <div className={`${bgColor} text-white ${title === 'Spezialitäten' ? 'px-2 py-1' : 'px-2 py-1'} rounded-t-xl`}>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-0">{title}</h2>
        {subTitle && (
          <p className="text-xs opacity-90 mb-0">{subTitle}</p>
        )}
        {description && (
          <p className="text-sm sm:text-base opacity-90 mb-0">{description}</p>
        )}
      </div>

      <div className="bg-white rounded-b-xl shadow-lg overflow-hidden">
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1 mb-1">
                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
                      {item.number}
                    </span>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-none">
                      {item.name}
                    </h3>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm sm:text-base text-gray-600 mb-1 leading-tight">
                      {item.description}
                    </p>
                  )}
                  
                  {/* Compact indicator badges */}
                  <div className="flex items-center gap-2 mb-2">
                    {item.sizes && item.sizes.length > 0 && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium border border-blue-200">
                        ⭐ Größen verfügbar
                      </span>
                    )}
                    
                    {item.isWunschPizza && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-medium border border-purple-200">
                        🍕 4 Zutaten wählbar
                      </span>
                    )}
                    
                    {(item.isPizza || item.isWunschPizza) && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium border border-green-200">
                        + Extras verfügbar
                      </span>
                    )}
                    
                    {(item.isSpezialitaet || item.name.toLowerCase().includes('salat') || item.isBeerSelection) && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-medium border border-yellow-200">
                        🥄 Soße wählbar
                      </span>
                    )}
                    
                    {item.isPasta && (
                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full font-medium border border-orange-200">
                        🍝 Nudelsorte wählbar
                      </span>
                    )}
                  </div>
                  
                  {item.allergens && (
                    <p className="text-xs text-gray-500">
                      Allergene: {item.allergens}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  {item.sizes && item.sizes.length > 0 ? (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">ab</p>
                      <p className="text-lg sm:text-xl font-bold text-orange-600">
                        {Math.min(...item.sizes.map(s => s.price)).toFixed(2).replace('.', ',')} €
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg sm:text-xl font-bold text-orange-600">
                      {item.price.toFixed(2).replace('.', ',')} €
                    </p>
                  )}

                  <button
                    onClick={() => handleItemClick(item)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg transition-colors font-medium flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Hinzufügen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={handleCloseModal}
          onAddToOrder={onAddToOrder}
        />
      )}
    </section>
  );
});

MenuSection.displayName = 'MenuSection';
ItemModal.displayName = 'ItemModal';

export default MenuSection;