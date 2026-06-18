import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import { apiFetch } from "../utils/api";
import { categoryToSlug } from "../utils/catalog";

function EventsPage({ authToken, currentPath = "/events", events = [], isLoggedIn, onRequireLogin }) {
  const [eventFilter, setEventFilter] = useState("all");
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [savingEventId, setSavingEventId] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCategories, setSelectedCategories] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const selectedSlug = currentPath.replace(/^\/events\/?/, "");
  const selectedEvent = selectedSlug
    ? events.find((event) => eventToSlug(event) === selectedSlug || String(event.id || "") === selectedSlug)
    : null;
  const filteredEvents = events.filter((event) => {
    const eventId = String(event.id || event.name || "");

    if (eventFilter === "registered") {
      return registeredEventIds.has(eventId);
    }

    if (eventFilter === "upcoming") {
      return !isCompletedEvent(event);
    }

    if (eventFilter === "completed") {
      return isCompletedEvent(event);
    }

    return true;
  });

  useEffect(() => {
    if (!selectedEvent?.id) {
      setLeaderboard([]);
      return undefined;
    }

    let isMounted = true;
    async function loadLeaderboard() {
      try {
        const response = await apiFetch(`/api/events/${encodeURIComponent(selectedEvent.id)}/leaderboard`);
        const data = await response.json().catch(() => ({}));
        if (isMounted && response.ok) {
          setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
        }
      } catch {
        if (isMounted) setLeaderboard([]);
      }
    }

    loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (!authToken || !isLoggedIn) {
      setRegisteredEventIds(new Set());
      return undefined;
    }

    let isMounted = true;

    async function loadRegistrations() {
      try {
        const response = await apiFetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) return;

        const registrations = Array.isArray(data.user?.eventRegistrations) ? data.user.eventRegistrations : [];

        if (isMounted) {
          setRegisteredEventIds(new Set(registrations.map((entry) => String(entry.eventId || ""))));
        }
      } catch {
        // The register action will surface auth problems when the user clicks.
      }
    }

    loadRegistrations();

    return () => {
      isMounted = false;
    };
  }, [authToken, isLoggedIn]);

  const handleRegister = async (event) => {
    const eventId = String(event.id || "");
    const categories = getSportsCategories(event);
    const category = selectedCategories[eventId] || categories[0] || "";

    if (!isLoggedIn) {
      showToast("Login to register for events");
      onRequireLogin?.();
      return;
    }

    if (!eventId || savingEventId) return;

    setSavingEventId(eventId);
    setMessage("");

    try {
      const response = await apiFetch(`/api/events/${encodeURIComponent(eventId)}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ category })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to register for this event.");
      }

      setRegisteredEventIds((current) => new Set([...current, eventId]));
      const successText = isPaidEvent(event)
        ? "Registration saved. Payment can be completed with VOID support."
        : "Registration confirmed.";
      setMessage(successText);
      showToast(successText);
    } catch (error) {
      const errorText = error.message || "Unable to register for this event.";
      setMessage(errorText);
      showToast(errorText);
    } finally {
      setSavingEventId("");
    }
  };

  if (selectedEvent) {
    const eventId = String(selectedEvent.id || selectedEvent.name || "");
    const registered = registeredEventIds.has(eventId);
    const paid = isPaidEvent(selectedEvent);
    const isSports = getEventType(selectedEvent) === "Sports";
    const categories = getSportsCategories(selectedEvent);
    const gallery = getEventGallery(selectedEvent);

    return (
      <section className="page-section events-page event-detail-page">
        <a className="event-back-link" href="#/events">Back to events</a>
        <div className="event-detail-shell">
          <div>
            {selectedEvent.image ? (
              <div className="event-detail-media">
                <img src={selectedEvent.image} alt={selectedEvent.name || "VOID event"} />
              </div>
            ) : null}
            {gallery.length ? (
              <div className="event-card-gallery">
                {gallery.slice(0, 4).map((photo, photoIndex) => (
                  <img src={photo} alt="" key={`${eventId}-detail-photo-${photoIndex}`} />
                ))}
              </div>
            ) : null}
          </div>
          <div className="event-detail-copy">
            <span>{`${getEventType(selectedEvent)} / ${paid ? selectedEvent.price || "Paid" : "Free"}`}</span>
            <h1>{selectedEvent.name || "VOID Event"}</h1>
            <p>{selectedEvent.description || selectedEvent.details || "Event details will be updated soon."}</p>
            <div className="event-meta-list">
              <EventMeta icon={CalendarDays} value={formatDate(selectedEvent.date)} />
              <EventMeta icon={MapPin} value={selectedEvent.location || "Location to be announced"} />
              <EventMeta icon={Users} value={selectedEvent.details || "Event details coming soon"} />
            </div>
            {isSports ? (
              <>
                <label className="event-category-select">
                  <span>Sports category</span>
                  <select
                    value={selectedCategories[eventId] || categories[0] || ""}
                    onChange={(selectEvent) =>
                      setSelectedCategories((current) => ({ ...current, [eventId]: selectEvent.target.value }))
                    }
                  >
                    {categories.map((category) => (
                      <option value={category} key={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="primary-link dark-link"
                  type="button"
                  onClick={() => handleRegister(selectedEvent)}
                  disabled={registered || savingEventId === eventId}
                >
                  {registered ? "Registered" : savingEventId === eventId ? "Registering..." : "Register"}
                </button>
              </>
            ) : null}
          </div>
        </div>
        <Leaderboard entries={leaderboard} />
      </section>
    );
  }

  return (
    <section className="page-section events-page">
      <div className="page-heading">
        <span>Events</span>
        <h1>VOID Events</h1>
        <p>Join VOID training meets, launch sessions, community workouts, and paid workshops.</p>
      </div>

      {message ? <div className="admin-notice events-notice">{message}</div> : null}

      <div className="event-filter-bar" aria-label="Filter events">
        {[
          { id: "all", label: "All" },
          { id: "registered", label: "Registered" },
          { id: "upcoming", label: "Upcoming" },
          { id: "completed", label: "Completed" }
        ].map((filter) => (
          <button
            className={eventFilter === filter.id ? "is-active" : ""}
            key={filter.id}
            onClick={() => setEventFilter(filter.id)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      {events.length ? (
        <div className="events-grid">
          {filteredEvents.map((event) => {
            const eventId = String(event.id || event.name || "");
            const registered = registeredEventIds.has(eventId);
            const paid = isPaidEvent(event);
            const isSports = getEventType(event) === "Sports";
            const categories = getSportsCategories(event);
            const winners = getWinners(event);
            const gallery = getEventGallery(event);

            return (
              <article className="event-card" key={eventId}>
                {event.image ? (
                  <div className="event-card-media">
                    <img src={event.image} alt={event.name || "VOID event"} />
                  </div>
                ) : null}
                <div className="event-card-head">
                  <span>{`${getEventType(event)} / ${paid ? "Paid" : "Free"}`}</span>
                  <strong>{paid ? event.price || "Paid" : "Free"}</strong>
                </div>
                <h2>{event.name || event.eventName || "VOID Event"}</h2>
                <p>{event.description || event.details || "Event details will be updated soon."}</p>
                <div className="event-meta-list">
                  <EventMeta icon={CalendarDays} value={formatDate(event.date)} />
                  <EventMeta icon={MapPin} value={event.location || "Location to be announced"} />
                  <EventMeta icon={Users} value={event.details || "Event details coming soon"} />
                </div>
                {gallery.length ? (
                  <div className="event-card-gallery">
                    {gallery.slice(0, 4).map((photo, photoIndex) => (
                      <img src={photo} alt="" key={`${eventId}-photo-${photoIndex}`} />
                    ))}
                  </div>
                ) : null}
                {isSports ? (
                  <>
                    <label className="event-category-select">
                      <span>Sports category</span>
                      <select
                        value={selectedCategories[eventId] || categories[0] || ""}
                        onChange={(selectEvent) =>
                          setSelectedCategories((current) => ({ ...current, [eventId]: selectEvent.target.value }))
                        }
                      >
                        {categories.map((category) => (
                          <option value={category} key={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                    {winners.length ? (
                      <div className="event-winners">
                        <div className="event-winners-title">
                          <Trophy size={17} />
                          <span>Winners</span>
                        </div>
                        {winners.map((winner) => (
                          <div className="event-winner-row" key={winner.category}>
                            <span>{winner.category}</span>
                            <strong>{winner.name}</strong>
                          </div>
                        ))}
                        {event.winnerNotes ? <p>{event.winnerNotes}</p> : null}
                      </div>
                    ) : null}
                    <button
                      className="primary-link dark-link"
                      type="button"
                      onClick={() => handleRegister(event)}
                      disabled={registered || savingEventId === eventId}
                    >
                      {registered ? "Registered" : savingEventId === eventId ? "Registering..." : "Register"}
                    </button>
                    <a className="secondary-link event-detail-link" href={`#/events/${eventToSlug(event)}`}>
                      Details
                    </a>
                  </>
                ) : (
                  <>
                    <div className="event-marketing-note">Marketing event</div>
                    <a className="secondary-link event-detail-link" href={`#/events/${eventToSlug(event)}`}>
                      Details
                    </a>
                  </>
                )}
              </article>
            );
          })}
        </div>
      ) : null}

      {events.length && !filteredEvents.length ? (
        <div className="account-empty compact">
          <span>Events</span>
          <h3>No matching events</h3>
          <p>Try another filter to see more VOID events.</p>
        </div>
      ) : (
        !events.length ? (
        <div className="account-empty">
          <span>Events</span>
          <h3>No events open</h3>
          <p>New VOID events will appear here when the admin publishes them.</p>
        </div>
        ) : null
      )}
    </section>
  );
}

function Leaderboard({ entries }) {
  return (
    <section className="event-leaderboard" aria-label="Event leaderboard">
      <div className="event-winners-title">
        <Trophy size={18} />
        <span>Leaderboard</span>
      </div>
      {entries.length ? (
        <div className="leaderboard-list">
          {entries.map((entry, index) => (
            <div className="leaderboard-row" key={`${entry.userId}-${entry.category}`}>
              <strong>{index + 1}</strong>
              <span>{entry.name}</span>
              <em>{entry.category}</em>
              <b>{entry.points} pts</b>
            </div>
          ))}
        </div>
      ) : (
        <p>No registered users yet.</p>
      )}
    </section>
  );
}

function eventToSlug(event) {
  return categoryToSlug(event.slug || event.name || event.id || "event");
}

function EventMeta({ icon: Icon, value }) {
  return (
    <div className="event-meta">
      <Icon size={17} />
      <span>{value || "Not available"}</span>
    </div>
  );
}

function isPaidEvent(event) {
  return String(event.feeType || event.type || "").toLowerCase() === "paid";
}

function getEventType(event) {
  return String(event.eventType || event.kind || "").toLowerCase() === "marketing" ? "Marketing" : "Sports";
}

function getSportsCategories(event) {
  if (Array.isArray(event.sportsCategories) && event.sportsCategories.length) {
    return event.sportsCategories.filter(Boolean);
  }

  return String(event.sportsCategories || "Mixed, Mens, Womens")
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getWinners(event) {
  return [
    { category: "Mixed", name: event.mixedWinner },
    { category: "Mens", name: event.mensWinner },
    { category: "Womens", name: event.womensWinner }
  ].filter((winner) => winner.name);
}

function getEventGallery(event) {
  if (Array.isArray(event.gallery)) {
    return event.gallery.filter(Boolean);
  }

  return String(event.gallery || "")
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isCompletedEvent(event) {
  if (!event?.date) {
    return false;
  }

  const eventDate = new Date(event.date);

  if (Number.isNaN(eventDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  return eventDate < today;
}

function formatDate(value) {
  if (!value) {
    return "Date to be announced";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function showToast(msg) {
  window.dispatchEvent(new CustomEvent("void:toast", { detail: { msg } }));
}

export default EventsPage;
