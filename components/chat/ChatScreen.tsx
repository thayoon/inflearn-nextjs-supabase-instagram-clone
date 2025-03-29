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

export async function deletedMessage(id) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from("message")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAllMessages({ chatUserId }) {
  if (chatUserId === null) return [];

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

export default function ChatScreen({ loggedInUser }) {
  const selectedUserID = useRecoilValue(selectedUserIdState);
  const selectedUserIndex = useRecoilValue(selectedUserIndexState);
  const presence = useRecoilValue(presenceState);
  const [message, setMessage] = useState("");

  const channelRef = useRef(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);

  const chatRef = useRef<HTMLDivElement>(null);
  const [scrollOn, setScrollOn] = useState(true);

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
      setScrollOn(true);
    },
  });

  const getAllMessagesQuery = useQuery({
    queryKey: ["message", selectedUserID],
    queryFn: () => getAllMessages({ chatUserId: selectedUserID }),
  });

  const deletedMessageMutation = useMutation({
    mutationFn: deletedMessage,
    onSuccess: () => {
      getAllMessagesQuery.refetch();
      setScrollOn(false);
    },
  });

  const realTimeSubscription = () => {
    const channel = supabase.channel("message_postgres_changes", {
      config: {
        presence: {
          key: `${loggedInUser.email?.split("@")?.[0]}-${
            selectedUserQuery.data?.email?.split("@")?.[0]
          }`,
        },
      },
    });
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message" },
        (payload) => {
          if (payload.eventType === "INSERT" && !payload.errors) {
            getAllMessagesQuery.refetch();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "message" },
        (payload) => {
          if (payload.eventType === "UPDATE" && !payload.errors) {
            getAllMessagesQuery.refetch();
            setScrollOn(false);
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();

        let filteredUsers = [];

        Object.keys(newState).forEach((key) => {
          if (
            key ===
            `${loggedInUser.email?.split("@")?.[0]}-${
              selectedUserQuery.data?.email?.split("@")?.[0]
            }`
          )
            return;

          const presences = newState[key];

          presences.forEach(
            (presence: {
              presence_ref: string;
              isTyping?: boolean;
              name?: string;
            }) => {
              if (presence.isTyping) {
                filteredUsers.push(presence.name);
              }
            }
          );
        });

        setTypingUsers(filteredUsers);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        await channel.track({
          onlineAt: new Date().toISOString(),
          isTyping: false,
          name: loggedInUser.email?.split("@")?.[0],
        });
      });

    return channel;
  };

  const trackTyping = async (status) => {
    await channelRef.current.track({
      isTyping: status,
      name: loggedInUser.email?.split("@")?.[0],
    });
  };

  const handleInputChange = async (e) => {
    setMessage(e.target.value);

    if (!isTypingRef.current) {
      await trackTyping(true);
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
      if (!isTypingRef.current) return;
      await trackTyping(false);

      isTypingRef.current = false;
    }, 2000);
  };

  useEffect(() => {
    if (!selectedUserID) return;

    channelRef.current = realTimeSubscription();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [selectedUserQuery?.data]);

  useEffect(() => {
    if (!chatRef.current || !getAllMessagesQuery.isSuccess) return;

    if (scrollOn) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [
    selectedUserID,
    getAllMessagesQuery.isSuccess,
    getAllMessagesQuery.data,
    scrollOn,
  ]);

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
        className="w-full overflow-y-scroll flex-1 flex flex-col p-4 gap-3 relative"
      >
        {getAllMessagesQuery.data?.map((message) => (
          <Message
            key={message.id}
            isFromMe={message.receiver === selectedUserID}
            isDeleted={message.is_deleted}
            onClickDeleted={() => deletedMessageMutation.mutate(message.id)}
            message={
              message.is_deleted
                ? "이 메시지는 삭제되었습니다."
                : message.message
            }
          />
        ))}
      </div>

      {/* 채팅방 영역 */}
      <div className="flex flex-col">
        {typingUsers.length > 0 && (
          <div className="w-full flex items-center space-x-2 text-gray-500">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
            <div
              className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: "0.4s" }}
            />
            <span className="text-sm">{typingUsers[0]} is typing...</span>
          </div>
        )}
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
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
    </div>
  ) : (
    <div className="w-full"></div>
  );
}
