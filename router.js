import express from "express";

import index from "./routes/index.js"
import player from "./routes/player.js";
import error from "./routes/error.js";
import validate from "./routes/validate.js"

const router = new express.Router();

router.use(`/error`, error);
router.use(`/validate`, validate);
router.use(`/player`, player);
router.use(`/`, index);

router.get(`*`, (request, response) => {
    response.status(404);
    response.redirect(`/`);
});

export default router;
