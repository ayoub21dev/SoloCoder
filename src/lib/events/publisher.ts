import type { DomainEvent } from "@/lib/events/contracts";

export interface RealtimePublisher {
  publish(channel: string, event: DomainEvent): Promise<void>;
}

export class NoopRealtimePublisher implements RealtimePublisher {
  async publish(channel: string, event: DomainEvent): Promise<void> {
    void channel;
    void event;
    return Promise.resolve();
  }
}

export function createRealtimePublisher(): RealtimePublisher {
  return new NoopRealtimePublisher();
}
