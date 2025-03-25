"use client";

import { useQuery } from "@tanstack/react-query";
import Person from "./Person";
import { useRecoilState } from "recoil";
import {
  selectedUserIdState,
  selectedUserIndexState,
} from "utils/recoil/atoms";
import { getAllUsers } from "actions/chatActions";

export default function ChatPeopleList({ loggedInUser }) {
  const [selectedUserID, setSelectedUserID] =
    useRecoilState(selectedUserIdState);
  const [selectedUserIndex, setSelectedUserIndex] = useRecoilState(
    selectedUserIndexState
  );

  // getAllUsers
  const getAllUsersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const allUser = await getAllUsers();
      console.log(allUser);
      return allUser.filter((user) => user.id !== loggedInUser.id);
    },
  });

  return (
    <div className="h-screen min-w-60 flex flex-col bg-gray-50">
      {getAllUsersQuery.data?.map((user, index) => (
        <Person
          onClick={() => {
            setSelectedUserID(user.id);
            setSelectedUserIndex(index);
          }}
          index={index}
          userId={user.id}
          name={user.email.split("@")[0]}
          onlineAt={new Date().toISOString()}
          isActive={selectedUserID === user.id}
          onChatScreen={false}
        />
      ))}
      {/* <Person
        onClick={() => setSelectedIndex(0)}
        index={0}
        userId={"user1"}
        name={"name1"}
        onlineAt={new Date().toISOString()}
        isActive={selectedIndex === 0}
        onChatScreen={false}
      />
      <Person
        onClick={() => setSelectedIndex(1)}
        index={1}
        userId={"user2"}
        name={"name2"}
        onlineAt={new Date().toISOString()}
        isActive={selectedIndex === 1}
        onChatScreen={false}
      /> */}
    </div>
  );
}
