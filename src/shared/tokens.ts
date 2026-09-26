// Player token catalogue shared by server and client.
// The client's art module supplies the SVG for each id; colors here are the source of truth for UI accents.

export interface TokenInfo { id: string; name: string; color: string; }

export const TOKEN_LIST: TokenInfo[] = [
  { id: 'hat', name: 'Top Hat', color: '#d9413a' },
  { id: 'boat', name: 'Sailboat', color: '#2f7fd6' },
  { id: 'dog', name: 'Dog', color: '#c9772b' },
  { id: 'car', name: 'Race Car', color: '#e8b923' },
  { id: 'cat', name: 'Cat', color: '#8e5bd1' },
  { id: 'rocket', name: 'Rocket', color: '#1fa39b' },
  { id: 'duck', name: 'Duck', color: '#e56aa3' },
  { id: 'robot', name: 'Robot', color: '#3aa655' },
];

export const TOKEN_BY_ID: Record<string, TokenInfo> = Object.fromEntries(TOKEN_LIST.map((t) => [t.id, t]));

export function isTokenId(id: unknown): id is string {
  return typeof id === 'string' && id in TOKEN_BY_ID;
}
