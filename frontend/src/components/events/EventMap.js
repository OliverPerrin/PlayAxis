import React, { lazy, Suspense } from "react";
import { Loading } from "../ui";

export { hasCoordinates } from "../../utils/coordinates";

const EventMapCanvas = lazy(() => import("./EventMapCanvas"));

export default function EventMap(props) {
  return (
    <Suspense fallback={<Loading text="Loading map" />}>
      <EventMapCanvas {...props} />
    </Suspense>
  );
}
