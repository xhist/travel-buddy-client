import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import { Plus, DollarSign, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Expenses = ({ tripId, isOrganizer }) => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    reason: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, [tripId]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/expenses/${tripId}`);
      setExpenses(response.data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await API.post('/expenses', {
        ...newExpense,
        tripId
      });

      if (response.data) {
        setExpenses(response.data);
        setNewExpense({ amount: '', reason: '' });
        toast.success('Expense added successfully');
      }
    } catch (err) {
      console.error('Error adding expense:', err);
      toast.error('Failed to add expense');
    }
  };

  const deleteExpense = async (expenseId) => {
    if (!isOrganizer) return;
    
    try {
      await API.delete(`/expenses/${expenseId}`);
      setExpenses(expenses.filter(exp => exp.id !== expenseId));
      toast.success('Expense deleted successfully');
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast.error('Failed to delete expense');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              placeholder="Amount"
              className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="text"
            value={newExpense.reason}
            onChange={(e) => setNewExpense({ ...newExpense, reason: e.target.value })}
            placeholder="Reason for expense"
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </form>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-200">
          Total Expenses: ${totalExpenses.toFixed(2)}
        </h3>
      </div>

      {expenses.length === 0 ? (
        <p className="text-gray-500 text-center">No expenses logged yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {expense.reason}
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${parseFloat(expense.amount).toFixed(2)}
                  </p>
                </div>
                {isOrganizer && (
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Expenses;