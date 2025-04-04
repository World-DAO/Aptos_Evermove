import { useCallback } from "react";

export function useGenericSpaceKeyDown(
  setValue: React.Dispatch<React.SetStateAction<string>>
) {
  return useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        // 使用 functional update 获取最新值
        setValue(prev => prev.substring(0, start) + " " + prev.substring(end));
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1;
        }, 0);
      }
    },
    [setValue]
  );
}
