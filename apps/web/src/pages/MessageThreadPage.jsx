import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import {
  listConversationMessages,
  sendMessage,
  subscribeToConversation,
} from "../lib/messages";

function formatTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString();
}

export default function MessageThreadPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState(null);

  function appendUniqueMessage(nextMessage) {
    if (!nextMessage || !nextMessage.id) {
      return;
    }

    setMessages((current) => {
      const exists = current.some((message) => message.id === nextMessage.id);
      if (exists) {
        return current;
      }

      return [...current, nextMessage].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }

  async function loadThread() {
    setLoading(true);
    setError("");

    try {
      const [profileData, threadData] = await Promise.all([
        apiRequest("/auth/me", { method: "GET" }),
        listConversationMessages(id),
      ]);
      setProfile(profileData.profile || null);
      setConversation(threadData.conversation || null);
      setMessages(threadData.messages || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThread();
  }, [id]);

  useEffect(() => {
    const unsubscribe = subscribeToConversation(id, {
      onMessage: (message) => {
        appendUniqueMessage(message);
      },
      onError: () => {
        setError((current) => current || "Live updates temporarily unavailable.");
      },
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  const participantsLabel = useMemo(() => {
    if (!conversation?.participants?.length) {
      return "Conversation participants";
    }

    return conversation.participants
      .map((participant) => participant.name || participant.email || participant.id)
      .join(", ");
  }, [conversation]);

  async function handleSend(event) {
    event.preventDefault();
    setSending(true);
    setStatus("");
    setError("");

    try {
      const result = await sendMessage(id, messageBody);
      appendUniqueMessage(result.message);
      setMessageBody("");
      setStatus("Message sent.");
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Message Thread</h2>
          <p className="subtle">Read and continue the conversation.</p>
        </div>
        <Link className="btn-link" to="/messages">
          Back to inbox
        </Link>
      </div>

      {loading && <p className="subtle">Loading thread...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && conversation && (
        <div className="thread-panel">
          <div className="thread-header">
            <div>
              <h3>{participantsLabel}</h3>
              <p className="subtle">Conversation ID: {conversation.id}</p>
            </div>
            {profile && (
              <div className="identity-badge compact">
                <span>{profile.name}</span>
                <small>{profile.role}</small>
              </div>
            )}
          </div>

          <div className="message-stream">
            {messages.length === 0 && <p className="subtle">No messages yet. Send the first one.</p>}
            {messages.map((message) => {
              const mine = message.senderId === profile?.id;
              return (
                <article key={message.id} className={mine ? "message-bubble mine" : "message-bubble"}>
                  <div className="message-meta">
                    <strong>{mine ? "You" : message.senderName || "Member"}</strong>
                    <span>{formatTime(message.createdAt)}</span>
                  </div>
                  <p>{message.body}</p>
                </article>
              );
            })}
          </div>

          <form className="message-compose" onSubmit={handleSend}>
            <label>
              New message
              <textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="Write your reply"
                required
              />
            </label>
            <button type="submit" disabled={sending}>
              {sending ? "Sending..." : "Send Message"}
            </button>
          </form>

          {status && <p className="ok-text">{status}</p>}
        </div>
      )}
    </section>
  );
}
