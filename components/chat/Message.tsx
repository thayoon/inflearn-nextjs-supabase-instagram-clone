"use client";
import { useState } from "react";

export default function Message({
  onClickDeleted,
  isDeleted,
  isFromMe,
  message,
}) {
  const [showButton, setShowButton] = useState(false);

  return (
    <div
      className={`relative flex ${
        isFromMe ? "justify-end" : "justify-start"
      } group`}
      onMouseEnter={() => setShowButton(true)}
      onMouseLeave={() => setShowButton(false)}
      onClick={() => setShowButton(true)}
    >
      <div
        className={`relative p-3 rounded-md max-w-[70%] ${
          isFromMe
            ? "ml-auto bg-light-blue-600 text-white"
            : "bg-gray-100 text-black"
        }`}
      >
        {!isDeleted && isFromMe && showButton && (
          <button
            onClick={onClickDeleted}
            className="absolute flex items-center justify-center left-[-30px] bottom-0 bg-red-500 w-6 h-6 text-center text-white rounded-full opacity-90 hover:opacity-100 transition"
          >
            <i className="fa fa-times"></i>
          </button>
        )}
        <p className={`${isDeleted ? "text-gray-900" : ""}`}>{message}</p>
      </div>
    </div>
  );
}
