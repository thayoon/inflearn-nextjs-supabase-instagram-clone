"use client";

import { Button } from "@material-tailwind/react";

export default function LogoutButton() {
  return (
    <Button color="red" onClick={() => console.log("logout")}>
      로그아웃
    </Button>
  );
}
