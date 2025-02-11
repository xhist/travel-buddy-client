import React, { useState, useEffect } from 'react';
import API from '../../api/api';

const PackingChecklist = ({ tripId }) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    API.get(`/checklists/${tripId}`).then((res) => setItems(res.data));
  }, [tripId]);

  const addItem = async () => {
    if (newItem.trim()) {
      const res = await API.post(`/checklists/${tripId}`, { itemName: newItem });
      setItems([...items, res.data]);
      setNewItem('');
    }
  };

  const toggleItem = async (itemId) => {
    const res = await API.put(`/checklists/${itemId}/toggle`);
    setItems(items.map((item) => (item.id === itemId ? res.data : item)));
  };

  const deleteItem = async (itemId) => {
    await API.delete(`/checklists/${itemId}`);
    setItems(items.filter((item) => item.id !== itemId));
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Packing Checklist</h3>
      <div className="mb-4">
        <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}
          placeholder="New item" className="px-4 py-2 border rounded w-full" />
        <button onClick={addItem} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">Add Item</button>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="flex justify-between items-center border-b py-2">
            <span className={item.isChecked ? 'line-through text-gray-500' : 'text-gray-800'}>
              {item.itemName}
            </span>
            <div className="space-x-2">
              <button onClick={() => toggleItem(item.id)} className="bg-green-500 text-white px-2 py-1 rounded">
                {item.isChecked ? 'Uncheck' : 'Check'}
              </button>
              <button onClick={() => deleteItem(item.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PackingChecklist;
