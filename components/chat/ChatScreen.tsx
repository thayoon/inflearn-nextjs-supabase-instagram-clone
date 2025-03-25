"use client";

import Person from "./Person";
import Message from "./Message";
import { useRecoilValue } from "recoil";
import {
  selectedUserIdState,
  selectedUserIndexState,
} from "utils/recoil/atoms";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "actions/chatActions";

export default function ChatScreen() {
  const selectedUserID = useRecoilValue(selectedUserIdState);
  const selectedUserIndex = useRecoilValue(selectedUserIndexState);
  const selectedUserQuery = useQuery({
    queryKey: ["user", selectedUserID],
    queryFn: () => getUserById(selectedUserID),
  });

  return selectedUserQuery.data !== null ? (
    <div className="w-full h-screen flex flex-col">
      {/* Active 유저 영역 */}
      <Person
        index={selectedUserIndex}
        userId={selectedUserQuery.data?.id}
        name={selectedUserQuery.data?.email?.split("@")?.[0]}
        onlineAt={new Date().toISOString()}
        isActive={false}
        onChatScreen={true}
      />
      {/* 채팅 영역 */}
      <div className="w-full flex-1 flex flex-col p-4 gap-3">
        <Message isFromMe={true} message={"HI"} />
        <Message isFromMe={false} message={"Hello"} />
        <Message isFromMe={true} message={"HI"} />
        <Message isFromMe={true} message={"HI"} />
        <Message isFromMe={false} message={"Hello"} />
        <Message isFromMe={false} message={"Hello"} />
      </div>

      {/* 채팅방 영역 */}
      <div className="flex">
        <input
          type="text"
          className="p-3 w-full border-2 border-light-blue-600"
          placeholder="메시지를 입력하세요."
        />
        <button
          className="min-w-20 p-3 bg-light-blue-600 text-white"
          color="light-blue"
        >
          <span>전송</span>
        </button>
      </div>
    </div>
  ) : (
    <div className="w-full"></div>
  );
}
