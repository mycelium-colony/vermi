export interface RelayInformation {
  name?: string;
  description?: string;
  pubkey?: string;
  contact?: string;
  supported_nips?: number[];
  software?: string;
  version?: string;
  limitation?: {
    max_message_length?: number;
    max_subscriptions?: number;
    max_filters?: number;
    max_limit?: number;
    max_subid_length?: number;
    min_prefix?: number;
    max_event_tags?: number;
    max_content_length?: number;
    min_pow_difficulty?: number;
    auth_required?: boolean;
    payment_required?: boolean;
  };
}

export async function fetchRelayInformation(relayUrl: string): Promise<RelayInformation | null> {
  try {
    const httpUrl = relayUrl.replace('wss://', 'https://');
    const response = await fetch(httpUrl, {
      headers: {
        'Accept': 'application/nostr+json'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch relay information for ${relayUrl}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data as RelayInformation;
  } catch (error) {
    console.error(`Error fetching relay information for ${relayUrl}:`, error);
    return null;
  }
}

export function isAuthRequired(relayInfo: RelayInformation | null): boolean {
  if (!relayInfo) return false;
  return relayInfo.limitation?.auth_required === true;
}

export function getRelayDisplayName(relayInfo: RelayInformation | null, relayUrl: string): string {
  if (!relayInfo) return relayUrl.replace('wss://', '');
  return relayInfo.name || relayUrl.replace('wss://', '');
}