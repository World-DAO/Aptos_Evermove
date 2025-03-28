import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import toast from "react-hot-toast";

import { storeBlob } from "@/lib/walrus";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/components/config/suiConstant";

export function useSubmission(objectId?: string) {
  const [content, setContent] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const { mutate: storeObject, isPending } = useMutation({
    mutationFn: (input: (File | string)[]) => storeBlob(input),
    onSuccess: (data) => {
      const tx = new Transaction();
      const args = []
      const blobId = []
      const blobAddress = []
      args.push(tx.makeMoveVec({ type: 'vector<string>', elements: [blobId.map] }))
      args.push(tx.pure("vector<string>", ["32","2"]));
      args.push(tx.pure("vector<address>", ["dsd"]));
      args.push(tx.pure("string", "Hello, world!"));
      tx.moveCall({
        target: `${PACKAGE_ID}::driftbottle::start_bottle`,
        arguments: args,
      });

      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onError: (err: Error) => {
            console.error(err.message);
            toast.error(err.message);
          },
          onSuccess: (result) => {
            console.log("Transaction successful, digest:", result.digest);
            toast.success("Operation completed successfully");
            setContent("");
            setVideo(null);
          },
        },
      );
    },
    onError: (error) => {
      console.log("Error", error);
      toast.error(error.message);
    },
  });

  const handleSubmit = async () => {
    if (isPending) return;

    const toStore = [];

    if (video) {
      const validVideoTypes = [
        "video/mp4",    // MP4
        "video/webm",   // WebM
        "video/ogg",    // OGG
        "video/x-matroska", // MKV
      ];
    
      // 检查文件类型
      if (
        !validVideoTypes.includes(video.type)
      ) {
        toast.error("Please upload a valid video file");
        return;
      }


      if (video.size > 50 * 1024 * 1024) {
        toast.error("File size cannot exceed 50MB");

        return;
      }
      toStore.push(video);
    }

    if (toStore.length === 0) {
      toast.error("Please enter text or upload an image");

      return;
    }

    storeObject(toStore);
  };

  return {
    content,
    setContent,
    video,
    setVideo,
    isChecking,
    isPending,
    handleSubmit,
  };
}