import nodemailer, { Transporter } from "nodemailer";
import { ApiError } from "../controllers/api-error";

function createTransporter(): Transporter {

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPass = process.env.GMAIL_APP_PASS;

    if (!gmailUser || !gmailAppPass) {
        throw new ApiError("Email credentials are missing in environment variables!", 500);
    }

    const transporter: Transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: gmailUser,
            pass: gmailAppPass,
        },
    });

    return transporter;
}

export async function sendMail(email: string, authorName: string, title: string, slug: string) {

    try {
        const transporter = createTransporter();

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: `${authorName} published a new blog`,
            html: `
                <h2>${authorName} published a new blog.</h2>

                <p>
                    <strong>${title}</strong>
                </p>

                <a href="http://localhost:4000/blogs/${slug}">
                    Read Blog
                </a>
            `,
        });
    } catch (err) {
        console.log(err);
    }
}