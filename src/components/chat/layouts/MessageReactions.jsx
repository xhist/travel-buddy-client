import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const REACTIONS = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  SURPRISED: '😮',
  SAD: '😢',
  ANGRY: '😠'
};

const MessageReactions = ({ message, onReact, isOwnMessage, showReactions, onReactionSelect }) => {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const menuRef = useRef(null);

  // Get reaction counts based on the database structure
  // Each reaction should have a reactionType
  const getReactionCounts = () => {
    const counts = {};
    if (message.reactions && Array.isArray(message.reactions)) {
      message.reactions.forEach((reaction) => {
        if (reaction && reaction.reactionType) {
          const type = reaction.reactionType;
          if (!counts[type]) {
            counts[type] = { count: 0, users: [] };
          }
          counts[type].count += 1;
          
          // Store user data if available
          if (reaction.userId) {
            counts[type].users.push({ 
              id: reaction.userId, 
              username: reaction.senderUsername || reaction.username || `User ${reaction.userId}` 
            });
          }
        }
      });
    }
    return counts;
  };

  const reactionCounts = getReactionCounts();

  const handleReactionClick = (reactionType) => {
    onReact(message.id, reactionType);
    // Hide the picker after selection
    if (onReactionSelect) onReactionSelect();
  };

  // Dialog for listing users for a given reaction type
  const ReactionUsersList = ({ reactionType, reactionData }) => {
    if (!reactionData || reactionData.count === 0) return null;
    
    return (
      <Dialog.Root
        open={selectedReaction === reactionType}
        onOpenChange={(open) => setSelectedReaction(open ? reactionType : null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg z-50">
            <Dialog.Title className="text-lg font-semibold mb-4 flex items-center gap-2">
              {REACTIONS[reactionType]} Reactions ({reactionData.count})
            </Dialog.Title>
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {reactionData.users.map((user, index) => (
                  <div
                    key={user.id || index}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/profile/${user.username}`}
                  >
                    <img
                      src={user.profilePicture || '/default-avatar.png'}
                      alt={user.username || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.username || 'Unknown User'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog.Close className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  };

  return (
    <>
      {/* Reaction Picker (shown on hover; picker always shows all options) */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} top-full mt-2 bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 flex items-center gap-1 z-20 border dark:border-gray-700`}
          >
            {Object.entries(REACTIONS).map(([type, emoji]) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReactionClick(type)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction Counts Bar: Only shows types that have at least one reaction */}
      {Object.keys(reactionCounts).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} bottom-0 translate-y-full mt-1 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-md px-2 py-1 flex items-center gap-1 z-10 text-sm border dark:border-gray-700`}
        >
          {Object.keys(reactionCounts).map(type => (
            <button
              key={type}
              onClick={() => setSelectedReaction(type)}
              className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full px-1 transition-colors"
            >
              <span>{REACTIONS[type]}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">{reactionCounts[type].count}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Reaction Details Dialogs */}
      {Object.keys(reactionCounts).map(type => (
        <ReactionUsersList key={type} reactionType={type} reactionData={reactionCounts[type]} />
      ))}
    </>
  );
};

export default MessageReactions;