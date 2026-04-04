import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { listConversations } from "../lib/messages";

function formatTime(value) {
  if (!value) {
    return "No messages yet";
  }

  return new Date(value).toLocaleString();
}

function buildPartnerLabel(conversation, currentUserId) {
  const participants = Array.isArray(conversation.participants)
    ? conversation.participants.filter((participant) => participant.id !== currentUserId)
    : [];

  if (participants.length === 0) {
    return "Direct conversation";
  }

  return participants.map((participant) => participant.name || participant.email || participant.id).join(", ");
}

export default function MessagesInboxPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [profile, setProfile] = useState(null);

  async function loadInbox() {
    setLoading(true);
    setError("");

    try {
      const [profileData, inboxData] = await Promise.all([
        apiRequest("/auth/me", { method: "GET" }),
        listConversations(),
      ]);
      setProfile(profileData.profile || null);
      setConversations(inboxData.conversations || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox();
  }, []);

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Messages Inbox</h2>
          <p className="subtle">Review your conversation threads and start a new one.</p>
        </div>
        {profile && (
          <div className="identity-badge">
            <span>{profile.name}</span>
            <small>{profile.role}</small>
            <small className="identity-id">ID: {profile.id}</small>
          </div>
        )}
      </div>

      <p className="subtle message-helper">
        Open any pitch or match card to contact the entrepreneur directly.
      </p>

      <div className="actions-row">
        <button className="btn-ghost" type="button" onClick={loadInbox} disabled={loading}>
          Refresh
        </button>
        <Link className="btn-link" to="/profile">
          View Profile
        </Link>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="subtle">Loading conversations...</p>}

      {!loading && conversations.length === 0 && (
        <p className="subtle">You do not have any conversations yet.</p>
      )}

      <div className="conversation-list">
        {conversations.map((conversation) => (
          <Link key={conversation.id} className="conversation-card" to={`/messages/${conversation.id}`}>
            <div className="conversation-card-top">
              <div>
                <h3>{buildPartnerLabel(conversation, profile?.id)}</h3>
                <p className="subtle">Updated {formatTime(conversation.lastMessageAt || conversation.updatedAt)}</p>
              </div>
              <span className="conversation-count">{conversation.participantCount} members</span>
            </div>

            <p className="conversation-preview">
              {conversation.lastMessage
                ? `${conversation.lastMessage.senderName || "Someone"}: ${conversation.lastMessage.body}`
                : "No messages yet"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
