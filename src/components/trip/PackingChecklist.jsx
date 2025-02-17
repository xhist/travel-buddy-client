import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { PlusCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PackingChecklist = ({ tripId }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newItem, setNewItem] = useState({
    itemName: '',
    category: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklist();
    fetchCategories();
  }, [tripId]);

  const fetchChecklist = async () => {
    try {
      const response = await API.get(`/checklists/${tripId}`);
      setItems(response.data || []);
    } catch (err) {
      console.error('Error fetching checklist:', err);
      toast.error('Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get('/checklists/categories');
      setCategories(response.data);
      // Set default category if available
      if (response.data.length > 0) {
        setNewItem(prev => ({ ...prev, category: response.data[0].name }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.itemName.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    try {
      const response = await API.post(`/checklists/${tripId}`, {
        itemName: newItem.itemName.trim(),
        category: newItem.category,
        tripId
      });

      setItems(response.data);
      setNewItem(prev => ({ ...prev, itemName: '' }));
      toast.success('Item added successfully');
    } catch (err) {
      console.error('Error adding item:', err);
      toast.error('Failed to add item');
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await API.delete(`/checklists/${itemId}`);
      setItems(items.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully');
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <form onSubmit={addItem} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={newItem.itemName}
            onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
            placeholder="Enter item name..."
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Add Item</span>
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No items in checklist yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                  >
                    <span className="text-gray-800 dark:text-gray-200">
                      {item.name}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PackingChecklist;