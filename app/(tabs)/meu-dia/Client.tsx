'use client';
import MeuDiaClientDefault, { MeuDiaClient as MeuDiaClientNamed } from './meu-dia-client';

// Re-export both ways so any import style compiles:
export const MeuDiaClient = MeuDiaClientNamed ?? MeuDiaClientDefault;
export default MeuDiaClientDefault;
