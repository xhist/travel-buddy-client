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

const MessageReactions = ({ message, onReact, isOwnMessage }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const handleReactionClick = (reactionType) => {
    onReact(message.id, reactionType);
  };

  const getReactionCounts = () => {
    if (!message.reactions?.length) return {};
    
    return message.reactions.reduce((acc, reaction) => {
      if (!reaction?.type) return acc;
      
      const type = reaction.type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          users: []
        };
      }
      
      acc[type].count += 1;
      if (reaction.user) {
        acc[type].users.push(reaction.user);
      }
      
      return acc;
    }, {});
  };

  const reactionCounts = getReactionCounts();

  const ReactionUsersList = ({ reactionType, reactionData }) => {
    if (!reactionData?.users?.length) return null;

    return (
      <Dialog.Root 
        open={selectedReaction === reactionType} 
        onOpenChange={() => setSelectedReaction(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] 
            w-[90vw] max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg z-50">
            <Dialog.Title className="text-lg font-semibold mb-4 flex items-center gap-2">
              {REACTIONS[reactionType]} Reactions ({reactionData.count})
            </Dialog.Title>
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {reactionData.users.map((user, index) => (
                  user && (
                    <div
                      key={user.id || index}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 
                        rounded-lg transition-colors"
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
                  )
                ))}
              </div>
            </div>
            <Dialog.Close className="absolute top-4 right-4 p-1 rounded-full 
              hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  };

  return (
    <>
      {/* Hidden hover trigger area */}
      <div
        ref={triggerRef}
        className="absolute inset-0 z-10"
        onMouseEnter={() => setShowReactions(true)}
      />

      {/* Reaction Menu */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute -bottom-12 ${isOwnMessage ? 'right-0' : 'left-0'} 
              bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 flex items-center gap-1 z-20 
              border dark:border-gray-700`}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
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

      {/* Display Existing Reactions */}
      {Object.entries(reactionCounts).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute -bottom-6 ${isOwnMessage ? 'right-2' : 'left-2'} 
            bg-white dark:bg-gray-800 rounded-full shadow-md px-2 py-1 
            flex items-center gap-1 z-5 text-sm border dark:border-gray-700`}
        >
          {Object.entries(reactionCounts).map(([type, data]) => (
            <button
              key={type}
              onClick={() => setSelectedReaction(type)}
              className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 
                rounded-full px-1 transition-colors"
            >
              <span>{REACTIONS[type]}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {data.count}
              </span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Reaction Users Modals */}
      {Object.entries(reactionCounts).map(([type, data]) => (
        <ReactionUsersList key={type} reactionType={type} reactionData={data} />
      ))}
    </>
  );
};

export default MessageReactions;