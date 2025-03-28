"use client";

import { useQuery } from "@tanstack/react-query";
import Person from "./Person";
import { useRecoilState } from "recoil";
import {
  presenceState,
  selectedUserIdState,
  selectedUserIndexState,
} from "utils/recoil/atoms";
import { getAllUsers } from "actions/chatActions";
import { createBrowserSupabaseClient } from "utils/supabase/client";
import { useEffect, useState } from "react";

export default function ChatPeopleList({ loggedInUser }) {
  const [selectedUserID, setSelectedUserID] =
    useRecoilState(selectedUserIdState);
  const [selectedUserIndex, setSelectedUserIndex] = useRecoilState(
    selectedUserIndexState
  );
  const [presence, setPresence] = useRecoilState(presenceState);
  const [onChat, setOnChat] = useState(false);

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const channel = supabase.channel("online_users", {
      config: {
        presence: {
          key: loggedInUser.id,
        },
      },
    });

    channel.on(
      "presence",
      {
        event: "sync",
      },
      () => {
        const newState = channel.presenceState();
        const newStateObj = JSON.parse(JSON.stringify(newState));
        setPresence(newStateObj);
      }
    );

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") {
        return;
      }

      const newPresenceStatus = await channel.track({
        onlineAt: new Date().toISOString(),
      });

      console.log(newPresenceStatus);
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

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
          key={user.id}
          onClick={() => {
            if (!onChat) {
              setOnChat(true);
              setSelectedUserID(user.id);
              setSelectedUserIndex(index);
            } else {
              setOnChat(false);
              setSelectedUserID(null);
              setSelectedUserIndex(null);
            }
          }}
          index={index}
          userId={user.id}
          name={user.email.split("@")[0]}
          onlineAt={presence?.[user.id]?.[0]?.onlineAt}
          isActive={selectedUserID === user.id}
          onChatScreen={false}
        />
      ))}
    </div>
  );
}
