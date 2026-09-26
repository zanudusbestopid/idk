// Player token catalogue shared by server and client.
// The client's art module supplies the SVG for each id; colors here are the source of truth for UI accents.

export interface TokenInfo { id: string; name: string; color: string; }

export const TOKEN_LIST: TokenInfo[] = [
  { id: 'hat', name: 'Top Hat', color: '#8e5bc4' },
  { id: 'boat', name: 'Sailboat', color: '#2f6fd6' },
  { id: 'dog', name: 'Dog', color: '#c47a3c' },
  { id: 'car', name: 'Race Car', color: '#d9413a' },
  { id: 'cat', name: 'Cat', color: '#e8649c' },
  { id: 'rocket', name: 'Rocket', color: '#2aa9a0' },
  { id: 'duck', name: 'Rubber Duck', color: '#f2b632' },
  { id: 'robot', name: 'Robot', color: '#3aa655' },
];

export const TOKEN_BY_ID: Record<string, TokenInfo> = Object.fromEntries(TOKEN_LIST.map((t) => [t.id, t]));

export function isTokenId(id: unknown): id is string {
  return typeof id === 'string' && id in TOKEN_BY_ID;
}
