import React, { useState, useEffect } from 'react';
import API from '../../api/api';

const Itinerary = ({ tripId }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    API.get(`/trips/${tripId}/itinerary`).then((res) => setItems(res.data));
  }, [tripId]);

  const exportPdf = async () => {
    const res = await API.get(`/trips/${tripId}/itinerary/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'itinerary.pdf');
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Itinerary</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="border-b py-2">
            <strong>{item.activityName}</strong> on {new Date(item.activityDate).toLocaleDateString()} at {item.location}
            <p>{item.notes}</p>
          </li>
        ))}
      </ul>
      <button onClick={exportPdf} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
        Export as PDF
      </button>
    </div>
  );
};

export default Itinerary;
