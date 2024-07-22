import { formatInTimeZone } from "date-fns-tz";

const convertDateToIST = (date) => {
  return formatInTimeZone(date, "Asia/Kolkata", "dd MMM yyyy HH:mm:ss");
};

export { convertDateToIST };
