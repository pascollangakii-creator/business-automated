
import React, { useState } from 'react';
import { SendIcon } from './Icon';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter sale details or ask for a summary..."
        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-shadow"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !text.trim()}
        className="flex-shrink-0 bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
      >
        <SendIcon className="h-6 w-6" />
      </button>
    </form>
  );
};

export default ChatInput;
