import BookEvent from "@/app/components/BookEvent";
import EventCard from "@/app/components/EventCard";
import { SerializedEvent } from "@/database";
import { getSimilarEventBySlug } from "@/lib/actions/event.actions";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const EventDetailItem = ({
  icon,
  alt,
  label,
}: {
  icon: string;
  alt: string;
  label: string;
}) => (
  <div className="flex-row-gap-2 items-center">
    <Image src={icon} alt={alt} width={17} height={17} />
    <p>{label}</p>
  </div>
);

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
  <div className="agend">
    <h2>Agenda</h2>

    <ul>
      {agendaItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

const EventTags = ({ tags }: { tags: string[] }) => (
  <div className="flex flex-row gap-1.5 flex-wrap">
    {tags.map((tag) => (
      <div className="pill" key={tag}>
        {tag}
      </div>
    ))}
  </div>
);

const EventDetailsContent = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const req = await fetch(`${BASE_URL}/api/events/${slug}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!req.ok) {
    return notFound();
  }

  const data = await req.json();
  if (!data.event) {
    return notFound();
  }

  const {
    description,
    overview,
    image,
    mode,
    location,
    date,
    time,
    audience,
    agenda,
    organizer,
    tags,
  } = data.event;

  const bookings = 10;

  const similarEvents = await getSimilarEventBySlug(slug);

  return (
    <section id="event">
      <div className="header">
        <h1>Event Description</h1>
        <p>{description}</p>
      </div>

      <div className="details">
        {/* Left side -  Event content*/}
        <div className="content">
          <Image
            src={image}
            alt="Event Banner"
            width={800}
            height={800}
            className="banner"
          />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event details</h2>

            <EventDetailItem
              icon="/icons/calendar.svg"
              alt="date"
              label={date}
            />
            <EventDetailItem icon="/icons/clock.svg" alt="time" label={time} />
            <EventDetailItem
              icon="/icons/pin.svg"
              alt="location"
              label={location}
            />
            <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
            <EventDetailItem
              icon="/icons/audience.svg"
              alt="target audience"
              label={audience}
            />
          </section>

          <EventAgenda agendaItems={agenda} />

          <section className="flex-col-gap-2">
            <h2>About the organizer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={tags} />
        </div>

        {/* Right side -  Booking form*/}
        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who have booked their spot!
              </p>
            ) : (
              <p>Be the first to book your spot!</p>
            )}
            <BookEvent />
          </div>
        </aside>
      </div>

      <div className="flex flex-col w-full gap-2 pt-20">
        <h2>Similar Events</h2>
        <div className="events">
          {similarEvents.length > 0 &&
            similarEvents.map((similarEvent: SerializedEvent) => (
              <EventCard key={similarEvent._id} {...similarEvent} />
            ))}
        </div>
      </div>
    </section>
  );
};

const EventDetails = ({ params }: { params: Promise<{ slug: string }> }) => {
  return (
    <Suspense fallback={<div>Loading event details...</div>}>
      <EventDetailsContent params={params} />
    </Suspense>
  );
};

export default EventDetails;
