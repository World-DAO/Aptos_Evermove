import { useState } from 'react';

interface ReplyInputProps {
  onSendReply: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function ReplyInput({ onSendReply, placeholder, className }: ReplyInputProps) {
  const [replyText, setReplyText] = useState("");

  const handleSubmit = () => {
    if (!replyText.trim()) return;
    onSendReply(replyText);
    setReplyText('');
  };

  return (
    <div className={className}>
      <textarea 
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#2A2A2F] border-2 border-[#4A4A4F] p-3
                text-[#4EEAFF] placeholder:text-[#4EEAFF]/50 
                focus:outline-none focus:border-[#4EEAFF]/50 resize-none"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSubmit}
          disabled={!replyText.trim()}
          className="px-3 py-1 bg-[#722F37] border border-[#4EEAFF]/30
                  text-[#4EEAFF] hover:bg-[#9D5BDE] transition-colors
                  font-pixel text-sm pixel-corners"
        >
          Reply
        </button>
      </div>
    </div>
  );
} 