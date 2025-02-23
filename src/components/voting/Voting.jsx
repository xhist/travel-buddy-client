import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import API from '../../api/api';
import { 
  Vote, 
  Check, 
  X, 
  BarChart2, 
  Users, 
  Clock,
  Lock,
  Unlock,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const VoteOption = ({ option, votes, userVote, onVote, totalVotes, disabled }) => {
  const percentage = totalVotes > 0 ? (votes.length / totalVotes) * 100 : 0;
  const hasVoted = userVote === option.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <button
        onClick={() => onVote(option.id)}
        disabled={disabled}
        className={`relative w-full p-4 rounded-lg border ${
          hasVoted 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
        } transition-all duration-200 z-10`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {option.text}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {votes.length} votes
          </span>
        </div>
        {votes.length > 0 && (
          <div className="mt-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className="h-full bg-blue-500"
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {percentage.toFixed(1)}%
            </div>
          </div>
        )}
      </button>
    </motion.div>
  );
};

const PollMessage = ({ poll, onVote, currentUser, onFinalize, isOrganizer, onEdit }) => {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const userVote = poll.options.find(opt => 
    opt.votes.includes(currentUser.id)
  )?.id;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 max-w-lg w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {poll.question}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created by {poll.creator.username}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalVotes} votes
          </span>
          {(isOrganizer || poll.creator.id === currentUser.id) && !poll.finalized && (
            <>
              <button
                onClick={() => onEdit(poll)}
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onFinalize(poll.id)}
                className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
              >
                <Lock className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {poll.options.map((option) => (
          <VoteOption
            key={option.id}
            option={option}
            votes={option.votes}
            userVote={userVote}
            onVote={onVote}
            totalVotes={totalVotes}
            disabled={poll.finalized}
          />
        ))}
      </div>

      {poll.finalized && (
        <div className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span className="text-sm">This poll has been finalized</span>
        </div>
      )}
    </div>
  );
};

const CreatePollForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [question, setQuestion] = useState(initialData?.question || '');
  const [options, setOptions] = useState(
    initialData?.options.map(opt => opt.text) || ['', '']
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast.error('Please enter at least 2 options');
      return;
    }

    onSubmit({
      question: question.trim(),
      options: options
        .filter(opt => opt.trim())
        .map(opt => ({ text: opt.trim() }))
    });
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Question
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Options
        </label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index] = e.target.value;
                setOptions(newOptions);
              }}
              placeholder={`Option ${index + 1}`}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {options.length < 10 && (
          <button
            type="button"
            onClick={addOption}
            className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1"
          >
            + Add Option
          </button>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Update Poll' : 'Create Poll'}
        </button>
      </div>
    </form>
  );
};

export { PollMessage, CreatePollForm };