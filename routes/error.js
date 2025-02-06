import express from "express";

const router = new express.Router();
router.get(`/`, (request, response) => {
    let { message } = request.query;
    if (!message || message === undefined)
        message = "Oops, something went wrong! Please try again.";

    return response.render(`error.ejs`, {
        message
    });
});

export default router;
