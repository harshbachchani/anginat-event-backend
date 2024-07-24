import { formatInTimeZone } from "date-fns-tz";

const convertDateToIST = (date) => {
  return formatInTimeZone(date, "Asia/Kolkata", "yyyy-MM-dd HH:mm");
};

console.log(convertDateToIST(new Date()));
export { convertDateToIST };
