import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../db/config.js";
import {
  deletefromCloudinary,
  uploadOnCloudinary,
} from "../utils/clodinary.js";

const registerEvent = asyncHandler(async (req, res, next) => {
  try {
    const imageLocalPath = req.file?.buffer;
    if (!imageLocalPath)
      return next(new ApiError(400, "Cannot get image local path"));

    const { name, city, date, address } = req.body;
    if (!(name && city && date && address))
      return next(new ApiError(400, "All the fields are required"));
    if (!Date.parse(date)) {
      return res.status(400).json({ error: "Invalid date format" });
    }
    const image = await uploadOnCloudinary(imageLocalPath);
    if (!image)
      return next(new ApiError(501, "Error on uploading image on clodinary"));
    const event = await prisma.event.create({
      data: {
        name,
        city,
        address,
        date: new Date(date),
        image: image.url,
        userId: req.user.id,
      },
    });

    if (!event) return next(new ApiError(501, "Error in registering event"));
    return res
      .status(200)
      .json(new ApiResponse(200, event, "Event registered"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const getEventDetails = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
    });
    if (!event)
      return next(new ApiError(400, "Cannot get event with provided Id"));
    return res
      .status(200)
      .json(new ApiResponse(200, event, "Event details fetched successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const deleteEvent = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return next(new ApiError(400, "Cannot get event with provided Id"));
    }
    await prisma.event.delete({ where: { id } });
    const clodinarypath = event.image;
    const result = await deletefromCloudinary([clodinarypath]);
    console.log("File deleted successfully ", result);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Event deleted successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
const updateEvent = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event)
      return next(new ApiError(400, "Cannot get event with provided Id"));
    const imageLocalPath = req.file?.buffer;
    let imagefile = "";
    if (imageLocalPath) {
      imagefile = await uploadOnCloudinary(imageLocalPath);
      if (!imagefile.url) {
        return next(new ApiError(501, "Error while uploading on clodinary"));
      }
    }
    if (imagefile !== "") updateinfo[image] = imagefile;
    const { name, city, address, date } = req.body;
    const updateinfo = {};
    if (name) updateinfo[name] = name;
    if (city) updateinfo[city] = city;
    if (address) updateinfo[address] = address;
    if (date) updateinfo[date] = date;
    if (Object.keys(updateinfo).length === 0)
      return next(new ApiError(400, "Give atleast one of the parameters"));
    const previouseventpath = event.image;
    const updatedevent = await prisma.event.update({
      where: { id },
      data: updateinfo,
    });
    if (imagefile !== "") {
      const result = await deletefromCloudinary([previouseventpath]);
      console.log("File deleted from clodinary ", result);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, updatedevent, "Updated Successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
export { registerEvent, getEventDetails, deleteEvent, updateEvent };
