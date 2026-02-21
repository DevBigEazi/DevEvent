import { IEvent } from "@/database";
import EventCard from "./components/EventCard";
import ExploreButton from "./components/ExploreButton";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const page = async () => {
  const res = await fetch(`${BASE_URL}/api/events`);
  const { events } = await res.json();

  return (
    <section>
      <h1 className="text-center">
        The Hub For Every Dev Events You Can&apos;t Miss
      </h1>
      <p className="text-center mt-5">
        Hackathons, Meetups, Conferences, All in one place.
      </p>

      <ExploreButton />

      <div className="mt-20 space-y-7">
        <h2>Featured Events</h2>

        <ul className="events">
          {events &&
            events.length > 0 &&
            events.map((event: IEvent) => (
              <li key={event.title}>
                <EventCard {...event} />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
};

export default page;
