import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router";
import ReactMarkdown from "react-markdown";

import "./Chat.css";

import {
  getChats,
  getChat,
  createChat,
  sendMessage,
  type Chat as ChatType,
  type Message,
} from "../../utils/api";

import ErrorImg from "../../assets/error.svg";
import { useModel } from "../../contexts/ModelContext";

type MobileContext = {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
};

export default function Chat() {
  // Chat state variables
  const [chats, setChats] = useState<ChatType[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChat] = useState<boolean>(true);
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);
  const [newChatTitle, setNewChatTitle] = useState<string>("");

  // Messages state variables
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<string>("");

  // Input state variables
  const [isSending, setIsSending] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");

  // Mobile sidebar state from AppLayout
  const { isMobileMenuOpen, setIsMobileMenuOpen } =
    useOutletContext<MobileContext>();

  // Global model selection, shared by all chats
  const { selectedModelId } = useModel();

  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLLIElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load existing chats list
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getChats(); // call getChats and await the result
        setChats(res.data || []); // save res.data in chats, or use an empty array if res.data is missing (falsy)
      } catch {
        setChatsError("Failed to load chats..."); // save an error message in chatsError
      } finally {
        setIsLoadingChat(false); // set isLoadingChats to false
      }
    };

    load();
  }, []);

  // Load messages when a chat is selected
  useEffect(() => {
    if (!activeChatId) return; // If activeChatId isn't set, return early

    const load = async () => {
      setMessages([]); // Clear messages
      setIsLoadingMessages(true); // Set isLoadingMessages to true
      setMessagesError(""); // Clear messagesError
      try {
        const res = await getChat(activeChatId); // call getChat(activeChatId) and await the result
        setMessages(res.data?.messages || []); // set messages to res.data?.messages, or an empty array if falsy
      } catch {
        setMessagesError("Failed to load messages."); // set messagesError to an error message
      } finally {
        setIsLoadingMessages(false); // set isLoadingMessages to false
      }
    };

    load();
  }, [activeChatId]);

  // Automatically scroll the chat to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Grow the input with its content (min/max height are set in CSS) and expose
  // its height so the message list can reserve space under the fixed input bar
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    chatRef.current?.style.setProperty("--input-height", `${el.offsetHeight}px`);
  }, [input]);

  // Create new chat
  const handleCreateChat = async () => {
    const title = newChatTitle.trim() || "New Chat";
    // Set isCreatingChat and newChatTitle back to default values
    setIsCreatingChat(false);
    setNewChatTitle("");
    try {
      const res = await createChat(title);
      if (res.data) {
        // Prepend the new chat and select it
        setChats((prev) => [res.data!, ...prev]);
        setActiveChatId(res.data._id);
        setIsMobileMenuOpen(false); // Close the sidebar after a new chat is created.
      }
    } catch {
      // An inline error could go here in the future
    }
  };

  // Message send handler
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeChatId || isSending) return;

    const userMessage: Message = {
      _id: Date.now().toString(),
      chatId: activeChatId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    // Append userMessage to the thread, clear the input, and set isSending to true
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const res = await sendMessage(activeChatId, text, selectedModelId);
      if (res.data) {
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== userMessage._id),
          ...res.data!,
        ]);
      }
    } catch {
      // Append an error Message to the thread
      const errorMessage: Message = {
        _id: Date.now().toString(),
        chatId: activeChatId,
        role: "assistant",
        content: "Something went wrong. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Enter key support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`chat${activeChatId ? "" : " chat_type_list"}`}
      ref={chatRef}
    >
      {/* Sidebar */}
      <aside
        className={`chat__sidebar${
          isMobileMenuOpen ? " chat__sidebar_is-open" : ""
        }`}
      >
        <button
          className="chat__new-button"
          type="button"
          onClick={() => setIsCreatingChat(true)}
        >
          New Chat
        </button>

        {isCreatingChat && (
          <input
            className="chat__title-input"
            type="text"
            placeholder="Chat name"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateChat();
              if (e.key === "Escape") {
                setIsCreatingChat(false);
                setNewChatTitle("");
              }
            }}
            autoFocus
          />
        )}

        {isLoadingChats && <p className="chat__sidebar-message">Loading…</p>}
        {chatsError && <p className="chat__sidebar-message">{chatsError}</p>}

        <ul className="chat__list">
          {chats.map((c) => (
            <li key={c._id}>
              <button
                type="button"
                className={
                  c._id === activeChatId
                    ? "chat__list-item chat__list-item_active"
                    : "chat__list-item"
                }
                aria-current={c._id === activeChatId ? "true" : undefined}
                title={c.title}
                onClick={() => {
                  setActiveChatId(c._id);
                  setIsMobileMenuOpen(false); // Close the sidebar when a chat is selected.
                }}
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat */}
      <div className="chat__main">
        {/* No chats or no selected chat, no errors, not loading */}
        {!messagesError && !isLoadingMessages && !activeChatId && (
          <div className="chat__container chat__container_type_no-messages">
            <h1 className="chat__title">
              Create a new chat or select an existing chat to start the
              conversation
            </h1>
            <button
              type="button"
              className="chat__standard-btn"
              onClick={() => {
                setIsCreatingChat(true);
                setIsMobileMenuOpen(true);
              }}
            >
              Start New Chat
            </button>
          </div>
        )}

        {/* Chat selected, but no messages */}
        {!messagesError &&
          !isLoadingMessages &&
          activeChatId &&
          messages.length === 0 && (
            <div className="chat__container chat__container_type_no-messages">
              <h1 className="chat__title">
                Ask a question below to start the conversation
              </h1>
            </div>
          )}

        {/* Loading */}
        {activeChatId && isLoadingMessages && (
          <div className="chat__container chat__container_type_no-messages">
            <p className="chat__title">Loading messages...</p>
          </div>
        )}

        {/* Error */}
        {activeChatId && messagesError && (
          <div className="chat__container chat__container_type_error">
            <img src={ErrorImg} alt="" className="chat__error-img" />
            <h1 className="chat__title chat__title_type_error">
              Looks like something went wrong
            </h1>
            <p className="chat__error-action">
              Try reloading the page or creating the chat again
            </p>
            <button
              type="button"
              className="chat__standard-btn"
              onClick={() => navigate("/")}
            >
              Go to the main page
            </button>
          </div>
        )}

        {/* Messages */}
        {activeChatId && !isLoadingMessages && !messagesError && (
          <>
            <ul className="chat__container chat__container_type_messages">
              {messages.map((msg) => (
                <li
                  key={msg._id}
                  className={
                    msg.role === "user"
                      ? "chat__message chat__message_type_user"
                      : "chat__message chat__message_type_assistant"
                  }
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </li>
              ))}
              {isSending && (
                <li className="chat__message chat__message_type_assistant chat__message_type_thinking">
                  Thinking…
                </li>
              )}
              <li ref={messagesEndRef} />
            </ul>
            <div className="chat__input-bar">
              <textarea
                ref={inputRef}
                className="chat__input"
                placeholder="Ask any question"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="chat__send-button"
                aria-label="Send message"
                onClick={handleSend}
                disabled={isSending || !input.trim()}
              ></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
