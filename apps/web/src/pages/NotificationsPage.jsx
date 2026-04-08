import { useEffect, useState } from "react";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/notifications";

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const list = await listNotifications();
      setNotifications(list);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onMarkRead(notificationId) {
    try {
      const updated = await markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? updated : item))
      );
    } catch (markError) {
      setError(markError.message);
    }
  }

  async function onMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) =>
          item.readAt
            ? item
            : {
                ...item,
                readAt: new Date().toISOString(),
              }
        )
      );
    } catch (markError) {
      setError(markError.message);
    }
  }

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  return (
    <section className="card">
      <h2>Notifications</h2>
      <p className="subtle">Stay updated on new messages and contact activity.</p>

      <div className="actions-row">
        <button type="button" onClick={loadData} className="btn-ghost">
          Refresh
        </button>
        <button type="button" onClick={onMarkAllRead} disabled={!unreadCount}>
          Mark All Read
        </button>
        <p className="subtle">Unread: {unreadCount}</p>
      </div>

      {loading && <p className="subtle">Loading notifications...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && notifications.length === 0 && (
        <p className="subtle">No notifications yet.</p>
      )}

      <div className="notification-list">
        {notifications.map((item) => (
          <article
            key={item.id}
            className={item.readAt ? "notification-item" : "notification-item unread"}
          >
            <div className="notification-item-top">
              <h3>{item.title}</h3>
              <span className="subtle">{formatDateTime(item.createdAt)}</span>
            </div>
            <p className="subtle">Type: {item.type}</p>
            {item.body && <p>{item.body}</p>}
            {!item.readAt && (
              <div className="actions-row">
                <button type="button" onClick={() => onMarkRead(item.id)}>
                  Mark Read
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
