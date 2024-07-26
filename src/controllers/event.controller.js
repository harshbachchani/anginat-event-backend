import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../db/config.js";
import { convertDateToIST } from "../services/dateconversion.service.js";
import {
  deletefromCloudinary,
  uploadOnCloudinary,
} from "../utils/clodinary.js";

const registerEvent = asyncHandler(async (req, res, next) => {
  try {
    const imageLocalPath = req.file?.buffer;
    if (!imageLocalPath)
      return next(new ApiError(400, "Cannot get image local path"));

    const {
      eventName,
      isPaid,
      address,
      city,
      eventDate,
      userJourney,
      eventTemplate,
      attendieType,
    } = req.body;

    if (
      !(
        eventName &&
        isPaid &&
        address &&
        city &&
        eventDate &&
        userJourney &&
        eventTemplate &&
        attendieType
      )
    )
      return next(new ApiError(400, "All fields are required"));
    if (!Date.parse(eventDate)) {
      return res.status(400).json({ error: "Invalid date format" });
    }
    if (new Date(eventDate) < new Date())
      return next(
        new ApiError(400, "Event date should be greater then today'date")
      );

    let parsedEventTemplate;
    try {
      parsedEventTemplate = JSON.parse(eventTemplate);
    } catch (error) {
      return next(new ApiError(400, "Invalid JSON for Event Template", error));
    }
    let parsedUserJourney;
    try {
      parsedUserJourney = JSON.parse(userJourney);
    } catch (error) {
      return next(new ApiError(400, "Invalid JSON for User Journey", error));
    }
    let parsedAttendieType;
    try {
      parsedAttendieType = JSON.parse(attendieType);
    } catch (error) {
      return next(new ApiError(400, "Invalid JSON for Attendie Type", error));
    }

    const image = await uploadOnCloudinary(imageLocalPath);
    if (!image)
      return next(new ApiError(501, "Error on uploading image on clodinary"));
    const event = await prisma.event.create({
      data: {
        eventName,
        city,
        isPaid: Boolean(isPaid),
        address,
        eventDate: new Date(eventDate),
        userJourney: parsedUserJourney,
        eventTemplate: parsedEventTemplate,
        attendieType: parsedAttendieType,
        image: image.url,
        adminId: parseInt(req.user.id),
      },
    });

    if (!event) return next(new ApiError(501, "Error in creating event"));
    event.eventDate = convertDateToIST(event.eventDate);
    return res
      .status(200)
      .json(new ApiResponse(200, event, "Event Created Successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const getAllCreatedEvents = asyncHandler(async (req, res, next) => {
  try {
    const user = req.user;
    const { status } = req.query;
    if (!user) return next(new ApiError("Cannot get User Details"));
    const events = await prisma.event.findMany({
      where: { adminId: user.id, status },
    });
    if (!events) return next(new ApiError(500, "Error in fetching events "));
    for (let event of events) {
      event.eventDate = convertDateToIST(event.eventDate);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, events, "Events fetched successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
const getEventDetails = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });
    if (!event)
      return next(new ApiError(400, "Cannot get event with provided Id"));
    event.eventDate = convertDateToIST(event.eventDate);
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
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });
    if (!event) {
      return next(new ApiError(400, "Cannot get event with provided Id"));
    }
    await prisma.event.delete({ where: { id: parseInt(id) } });
    const clodinarypath = event.image;
    const result = await deletefromCloudinary([clodinarypath]);

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
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });
    if (!event)
      return next(new ApiError(400, "Cannot get event with provided Id"));
    const updateinfo = {};

    const imageLocalPath = req.file?.buffer;
    let imagefile = "";
    if (imageLocalPath) {
      imagefile = await uploadOnCloudinary(imageLocalPath);
      if (!imagefile.url) {
        return next(new ApiError(501, "Error while uploading on clodinary"));
      }
    }
    if (imagefile !== "") updateinfo["image"] = imagefile.url;
    const {
      eventName,
      isPaid,
      address,
      city,
      eventDate,
      userJourney,
      eventTemplate,
      attendieType,
    } = req.body;
    if (eventName) updateinfo["eventName"] = eventName;
    if (isPaid) updateinfo["isPaid"] = Boolean(isPaid);
    if (address) updateinfo["address"] = address;
    if (city) updateinfo["city"] = city;
    if (userJourney) {
      try {
        const parsedUserJourney = JSON.parse(userJourney);
        updateinfo["userJourney"] = parsedUserJourney;
      } catch (err) {
        return next(new ApiError(400, "Invalid JSON for User Journey", err));
      }
    }
    if (eventTemplate) {
      try {
        const parsedEventTemplate = JSON.parse(eventTemplate);
        updateinfo["eventTemplate"] = parsedEventTemplate;
      } catch (error) {
        return next(
          new ApiError(400, "Invalid JSON for Event Template", error)
        );
      }
    }

    if (attendieType) {
      try {
        const parsedAttendieType = JSON.parse(attendieType);
        updateinfo["attendieType"] = parsedAttendieType;
      } catch (error) {
        return next(new ApiError(400, "Invalid JSON for Attendie Type", error));
      }
    }
    if (eventDate) updateinfo["eventDate"] = new Date(eventDate);
    if (Object.keys(updateinfo).length === 0)
      return next(new ApiError(400, "Give atleast one of the parameters"));
    const previouseventpath = event.image;
    console.log(updateinfo);
    const updatedevent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: updateinfo,
    });
    updatedevent.eventDate = convertDateToIST(updatedevent.eventDate);
    if (imagefile !== "") {
      await deletefromCloudinary([previouseventpath]);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedevent, "Updated Successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const getAllRegsiteredUser = asyncHandler(async (req, res, next) => {});
export {
  registerEvent,
  getEventDetails,
  deleteEvent,
  updateEvent,
  getAllCreatedEvents,
};
