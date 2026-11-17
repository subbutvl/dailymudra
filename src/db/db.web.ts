/** Browser preview has no SQLite; sessionRepo.web.ts keeps sessions in localStorage instead. */
export function getDb(): null {
  return null;
}
