/**
 * Форматирует Unix-время (в секундах) в читаемую дату с днём недели.
 * @param {number} timestamp – Unix-время в секундах
 * @param {string} [locale="ru-RU"] – локаль ("ru-RU" или "en-US")
 * @returns {string} – например "Пн, 21.09.2026, 12:00"
 */
export function formatDateWithWeekday(timestamp, locale = "ru-RU") {
  const date = new Date(timestamp * 1000);
  return `${date.toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}, ${date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`;
}