import { formatInTimeZone, format, toZonedTime } from "date-fns-tz";
import { parseISO } from "date-fns";

const convertDateToIST = (date) => {
  return formatInTimeZone(date, "Asia/Kolkata", "yyyy-MM-dd HH:mm");
};

const formatDateTime = (date) => {
  const offset = "+05:30";
  const mydateString = date.toISOString().replace("Z", offset);
  const mydate = parseISO(mydateString);
  const formattedDate = format(mydate, "dd-MMM-yyyy");
  return formattedDate;
};

export { convertDateToIST, formatDateTime };
