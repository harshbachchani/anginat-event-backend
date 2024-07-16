import prisma from "./config.js";

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log(`MySQL Connected`);
  } catch (error) {
    console.log(`MySQL connection Failed: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
