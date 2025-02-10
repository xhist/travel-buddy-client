import React, { useState, useEffect } from 'react';
import API from '../../api/api';

const Expenses = ({ tripId }) => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ payer: '', amount: '', purpose: '' });

  useEffect(() => {
    API.get(`/trips/${tripId}/expenses`).then((res) => setExpenses(res.data));
  }, [tripId]);

  const addExpense = async () => {
    const res = await API.post(`/trips/${tripId}/expenses`, newExpense);
    setExpenses([...expenses, res.data]);
    setNewExpense({ payer: '', amount: '', purpose: '' });
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Expenses</h3>
      <div className="mb-4">
        <input type="text" placeholder="Payer" value={newExpense.payer} onChange={(e) => setNewExpense({ ...newExpense, payer: e.target.value })} className="px-4 py-2 border rounded mr-2" />
        <input type="number" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} className="px-4 py-2 border rounded mr-2" />
        <input type="text" placeholder="Purpose" value={newExpense.purpose} onChange={(e) => setNewExpense({ ...newExpense, purpose: e.target.value })} className="px-4 py-2 border rounded mr-2" />
        <button onClick={addExpense} className="bg-blue-600 text-white px-4 py-2 rounded">Add Expense</button>
      </div>
      <ul>
        {expenses.map((exp) => (
          <li key={exp.id} className="border-b py-2">
            <strong>{exp.payer}</strong> spent <strong>${exp.amount}</strong> on {exp.purpose}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <p className="text-gray-700">Expense split summary will be calculated here.</p>
      </div>
    </div>
  );
};

export default Expenses;
