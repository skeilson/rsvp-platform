ALTER TABLE responses ADD CONSTRAINT responses_guest_id_unique UNIQUE (guest_id);
ALTER TABLE event_responses ADD CONSTRAINT event_responses_guest_id_event_id_unique UNIQUE (guest_id, event_id);
