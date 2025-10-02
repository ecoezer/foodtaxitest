import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
  Clock,
  MapPin,
  Phone,
  User,
  ShoppingCart,
  LogOut,
  Trash2,
  AlertTriangle,
  Package,
  CheckCircle,
  Monitor,
  Smartphone,
  Tablet,
  Globe
} from 'lucide-react';
import { OrderItem } from '../types';

interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
}

interface Order {
  id: string;
  orderType: 'pickup' | 'delivery';
  deliveryZone?: string;
  deliveryTime: 'asap' | 'specific';
  specificTime?: string;
  name: string;
  phone: string;
  street?: string;
  houseNumber?: string;
  postcode?: string;
  note?: string;
  orderItems: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  timestamp: number;
  ip_address?: string;
  device_info?: DeviceInfo;
}

interface OrderHistoryProps {
  onLogout: () => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ onLogout }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const ordersArray = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data.items,
            timestamp: data.created_at?.toMillis() || Date.now(),
            ip_address: data.ip_address,
            device_info: data.device_info
          };
        });
        setOrders(ordersArray);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to orders:', error);
      setOrders([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getFilteredOrders = () => {
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    switch (filter) {
      case 'today':
        return orders.filter(order => order.timestamp >= today);
      case 'week':
        return orders.filter(order => order.timestamp >= weekAgo);
      default:
        return orders;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalStats = () => {
    const filtered = getFilteredOrders();
    return {
      count: filtered.length,
      revenue: filtered.reduce((sum, order) => sum + order.total, 0)
    };
  };

  const stats = getTotalStats();
  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bestellverlauf</h1>
                <p className="text-sm text-gray-600">Alle eingegangenen Bestellungen</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bestellungen</p>
                <p className="text-3xl font-bold text-gray-900">{stats.count}</p>
              </div>
              <Package className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Umsatz</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.revenue.toFixed(2).replace('.', ',')} €
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilter('today')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'today'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Heute
              </button>
              <button
                onClick={() => setFilter('week')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'week'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 Tage
              </button>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Bestellungen gefunden
            </h3>
            <p className="text-gray-600">
              Es sind noch keine Bestellungen eingegangen.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      order.orderType === 'delivery' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {order.orderType === 'delivery' ? (
                        <MapPin className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Package className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {order.orderType === 'delivery' ? 'Lieferung' : 'Abholung'}
                      </h3>
                      <p className="text-sm text-gray-600">{formatDate(order.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      {order.total.toFixed(2).replace('.', ',')} €
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{order.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4" />
                      <span>{order.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4" />
                      <span>
                        {order.deliveryTime === 'asap'
                          ? 'So schnell wie möglich'
                          : `Um ${order.specificTime} Uhr`}
                      </span>
                    </div>
                  </div>

                  {order.orderType === 'delivery' && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Lieferadresse:</p>
                      <p className="text-sm text-blue-800">
                        {order.street} {order.houseNumber}<br />
                        {order.postcode}
                      </p>
                      {order.deliveryZone && (
                        <p className="text-xs text-blue-600 mt-1">
                          Zone: {order.deliveryZone}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Bestellte Artikel
                  </h4>
                  <div className="space-y-2">
                    {order.orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.quantity}x {item.menuItem.name}
                          </p>
                          {item.selectedSize && (
                            <p className="text-xs text-blue-600">
                              {item.selectedSize.name}
                            </p>
                          )}
                          {item.selectedIngredients && item.selectedIngredients.length > 0 && (
                            <p className="text-xs text-green-600">
                              Zutaten: {item.selectedIngredients.join(', ')}
                            </p>
                          )}
                          {item.selectedExtras && item.selectedExtras.length > 0 && (
                            <p className="text-xs text-purple-600">
                              Extras: {item.selectedExtras.join(', ')}
                            </p>
                          )}
                          {item.selectedPastaType && (
                            <p className="text-xs text-yellow-600">
                              Nudelsorte: {item.selectedPastaType}
                            </p>
                          )}
                          {item.selectedSauce && (
                            <p className="text-xs text-red-600">
                              Soße: {item.selectedSauce}
                            </p>
                          )}
                          {item.selectedSpecialRequest && item.selectedSpecialRequest !== 'Standard' && (
                            <p className="text-xs text-orange-600">
                              Sonderwunsch: {item.selectedSpecialRequest}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {(item.menuItem.price * item.quantity).toFixed(2).replace('.', ',')} €
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                    <div className="flex justify-between text-gray-700">
                      <span>Zwischensumme:</span>
                      <span>{order.subtotal.toFixed(2).replace('.', ',')} €</span>
                    </div>
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Liefergebühr:</span>
                        <span>{order.deliveryFee.toFixed(2).replace('.', ',')} €</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 text-lg pt-2">
                      <span>Gesamt:</span>
                      <span>{order.total.toFixed(2).replace('.', ',')} €</span>
                    </div>
                  </div>

                  {order.note && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-900 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Anmerkung:
                      </p>
                      <p className="text-sm text-yellow-800">{order.note}</p>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {order.ip_address && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          IP-Adresse:
                        </p>
                        <p className="text-sm text-gray-900 font-mono">{order.ip_address}</p>
                      </div>
                    )}

                    {order.device_info && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                          {order.device_info.deviceType === 'mobile' && <Smartphone className="w-3 h-3" />}
                          {order.device_info.deviceType === 'tablet' && <Tablet className="w-3 h-3" />}
                          {order.device_info.deviceType === 'desktop' && <Monitor className="w-3 h-3" />}
                          Gerät:
                        </p>
                        <p className="text-sm text-gray-900">
                          {order.device_info.browser} {order.device_info.browserVersion}
                        </p>
                        <p className="text-xs text-gray-600">
                          {order.device_info.os} • {order.device_info.deviceType === 'mobile' ? 'Mobil' : order.device_info.deviceType === 'tablet' ? 'Tablet' : 'Desktop'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
