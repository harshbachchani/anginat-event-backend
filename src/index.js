import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import connectDB from "./db/index.js";
import { app, httpServer } from "./app.js";
import scheduleTask from "./services/node-cron.service.js";

connectDB()
  .then((value) => {
    let myport = process.env.PORT || 8000;
    scheduleTask.start();
    httpServer.on("error", (err) => {
      console.log("Error in running app ", err);
      process.exit(1);
    });

    httpServer.listen(myport, () => {
      console.log(`Server is running at ${myport}`);
    });
  })
  .catch((err) => {
    console.log("MySQL connection Failed ", err);
  });
