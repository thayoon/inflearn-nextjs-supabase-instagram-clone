"use client";

import Person from "./Person";
import Message from "./Message";
import { useRecoilValue } from "recoil";
import {
  presenceState,
  selectedUserIdState,
  selectedUserIndexState,
} from "utils/recoil/atoms";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUserById } from "actions/chatActions";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@material-tailwind/react";
import { createBrowserSupabaseClient } from "utils/supabase/client";

export async function sendMessage({ message, chatUserId }) {
  const supabase = createBrowserSupabaseClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session.user) {
    throw new Error("User is not authenticated");
  }

  const { data, error: sendMessageError } = await supabase
    .from("message")
    .insert({
      message,
      receiver: chatUserId,
      // sender: session.user.id,
    });

  if (sendMessageError) {
    throw new Error(sendMessageError.message);
  }

  return data;
}

export async function getAllMessages({ chatUserId }) {
  const supabase = createBrowserSupabaseClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session.user) {
    throw new Error("User is not authenticated");
  }

  const { data, error: getMessagesError } = await supabase
    .from("message")
    .select("*")
    .or(`receiver.eq.${chatUserId}, receiver.eq.${session.user.id}`)
    .or(`sender.eq.${chatUserId}, sender.eq.${session.user.id}`)
    .order("created_at", { ascending: true });

  if (getMessagesError) {
    return [];
  }

  return data;
}

export default function ChatScreen() {
  const selectedUserID = useRecoilValue(selectedUserIdState);
  const selectedUserIndex = useRecoilValue(selectedUserIndexState);
  const presence = useRecoilValue(presenceState);
  const [message, setMessage] = useState("");

  const chatRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageAlert, setNewMessageAlert] = useState(false);

  const handleScroll = () => {
    if (!chatRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const atBottom = scrollHeight - clientHeight - scrollTop < 10;

    setIsAtBottom(atBottom);
    if (atBottom) setNewMessageAlert(false);
  };

  const supabase = createBrowserSupabaseClient();

  const selectedUserQuery = useQuery({
    queryKey: ["user", selectedUserID],
    queryFn: () => getUserById(selectedUserID),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      sendMessage({
        message,
        chatUserId: selectedUserID,
      });
    },
    onSuccess: () => {
      setMessage("");
      getAllMessagesQuery.refetch();
    },
  });

  const getAllMessagesQuery = useQuery({
    queryKey: ["message", selectedUserID],
    queryFn: () => getAllMessages({ chatUserId: selectedUserID }),
  });

  useEffect(() => {
    const channel = supabase
      .channel("message_postgres_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message" },
        (payload) => {
          if (payload.eventType === "INSERT" && !payload.errors) {
            getAllMessagesQuery.refetch();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!chatRef.current) return;

    const lastMessage =
      getAllMessagesQuery.data?.[getAllMessagesQuery.data.length - 1];

    if (lastMessage?.receiver === selectedUserID) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    } else if (!isAtBottom) {
      setNewMessageAlert(true);
    }
  }, [getAllMessagesQuery.data]);

  return selectedUserQuery.data !== null ? (
    <div className="w-full h-screen flex flex-col">
      {/* Active 유저 영역 */}
      <Person
        index={selectedUserIndex}
        userId={selectedUserQuery.data?.id}
        name={selectedUserQuery.data?.email?.split("@")?.[0]}
        onlineAt={presence?.[selectedUserID]?.[0]?.onlineAt}
        isActive={false}
        onChatScreen={true}
      />
      {/* 채팅 영역 */}
      <div
        ref={chatRef}
        onScroll={handleScroll}
        className="w-full overflow-y-scroll flex-1 flex flex-col p-4 gap-3 relative"
      >
        {/* 새 메시지 알림 */}
        {newMessageAlert && (
          <div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-500 text-black px-4 py-2 rounded-2xl cursor-pointer"
            onClick={() => {
              chatRef.current?.scrollTo({
                top: chatRef.current.scrollHeight,
                behavior: "smooth",
              });
              setNewMessageAlert(false);
            }}
          >
            새로운 메시지 📩
          </div>
        )}
        {getAllMessagesQuery.data?.map((message) => (
          <Message
            key={message.id}
            isFromMe={message.receiver === selectedUserID}
            message={message.message}
          />
        ))}
      </div>

      {/* 채팅방 영역 */}
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessageMutation.mutate();
          }}
          className="p-3 w-full border-2 border-light-blue-600"
          placeholder="메시지를 입력하세요."
        />
        <button
          onClick={() => sendMessageMutation.mutate()}
          className="min-w-20 p-3 bg-light-blue-600 text-white"
          color="light-blue"
        >
          {sendMessageMutation.isPending ? <Spinner /> : <span>전송</span>}
        </button>
      </div>
    </div>
  ) : (
    <div className="w-full"></div>
  );
}
